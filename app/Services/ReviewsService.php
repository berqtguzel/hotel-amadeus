<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class ReviewsService
{
    private const CACHE_KEY_PREFIX = 'omr_reviews_';

    /**
     * Önbellekten veya API'den yorumları getirir.
     */
    public function getReviews(string $locale): array
    {
        $locale = strtolower($locale);
        $cacheKey = $this->cacheKey($locale);

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($locale) {
            return $this->fetch($locale);
        });
    }

    /**
     * API'den aktif değerlendirme kriterlerini getirir.
     */
    public function getCriteria(string $locale): array
    {
        $locale = strtolower($locale);
        $cacheKey = $this->cacheKey($locale) . '_criteria';

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($locale) {
            $base     = rtrim(config('omr.base_url'), '/');
            $endpoint = rtrim(config('omr.endpoint'), '/');
            $tenant   = config('omr.main_tenant') ?: config('omr.tenant_id');

            if (!$tenant || !$base) {
                return [];
            }

            $url = "{$base}{$endpoint}/reviews/criteria";

            try {
                $response = Http::timeout(10)
                    ->withHeaders(['X-Tenant-ID' => $tenant])
                    ->get($url, [
                        'lang' => $locale,
                    ]);

                if (!$response->successful()) {
                    Log::debug('Reviews Criteria API failed', ['status' => $response->status()]);
                    return [];
                }

                $json = $response->json();
                return $json['data']['criteria'] ?? [];
            } catch (Throwable $e) {
                Log::debug('Reviews Criteria API error', ['error' => $e->getMessage()]);
                return [];
            }
        });
    }

    /**
     * Yeni bir yorum oluşturur (POST).
     */
    public function createReview(array $data): array
    {
        $base = rtrim(config('omr.base_url'), '/');
        $endpoint = rtrim(config('omr.endpoint'), '/');
        $tenant = config('omr.main_tenant') ?: config('omr.tenant_id');

        if (!$tenant || !$base) {
            return ['error' => 'Config missing'];
        }
        $url = "{$base}{$endpoint}/reviews";

        // Kriter puanları varsa API'ye gönderilecek formatı hazırlıyoruz
        $payload = [
            'author_name'  => $data['author_name'] ?? '',
            'author_email' => $data['author_email'] ?? '',
            'review_text'  => $data['content'] ?? '',
            'stay_date'    => now()->format('Y-m-d'),
        ];

        if (!empty($data['criteria_ratings'])) {
            $payload['criteria_ratings'] = $data['criteria_ratings'];
        } else {
            // Eğer kriter yoksa geriye dönük uyumluluk için genel puanı gönderiyoruz
            $payload['rating'] = $data['rating'] ?? 5;
        }

        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'X-Tenant-ID' => $tenant,
                    'Accept'      => 'application/json',
                ])
                ->post($url, $payload);

            if (!$response->successful()) {
                return [
                    'error'   => 'API_REJECTED',
                    'details' => $response->json()
                ];
            }

            $this->clearCache();
            return $response->json();

        } catch (\Throwable $e) {
            return ['error' => 'EXCEPTION', 'message' => $e->getMessage()];
        }
    }

    public function clearCache(): void
    {
        foreach (['de', 'en', 'tr'] as $locale) {
            Cache::forget($this->cacheKey($locale));
            Cache::forget($this->cacheKey($locale) . '_criteria');
        }
    }

    private function fetch(string $locale): array
    {
        $base     = rtrim(config('omr.base_url'), '/');
        $endpoint = rtrim(config('omr.endpoint'), '/');
        $tenant   = config('omr.main_tenant') ?: config('omr.tenant_id');

        if (!$tenant || !$base) {
            return [];
        }

        $url = "{$base}{$endpoint}/reviews";

        try {
            $response = Http::timeout(10)
                ->withHeaders(['X-Tenant-ID' => $tenant])
                ->get($url, [
                    'lang' => $locale,
                ]);

            if (!$response->successful()) {
                Log::debug('Reviews API failed', ['status' => $response->status()]);
                return [];
            }

            $json = $response->json();
            $data = $json['data'] ?? $json;

            if (is_array($data) && isset($data['items'])) {
                $data = $data['items'];
            }

            if (!is_array($data)) {
                return [];
            }

            return $this->normalizeReviews($data, $locale);

        } catch (Throwable $e) {
            Log::debug('Reviews API error', ['error' => $e->getMessage()]);
            return [];
        }
    }

    private function normalizeReviews(array $data, string $locale): array
    {
        $out = [];

        foreach ($data as $item) {
            if (!is_array($item)) continue;

            $attrs = $item['attributes'] ?? $item;

            if (isset($attrs['status']) && $attrs['status'] !== 'approved') {
                continue;
            }

            $ratingRaw = $attrs['overall_rating_stars'] ?? $attrs['rating'] ?? $attrs['stars'] ?? 5;
            $rating = is_numeric($ratingRaw) ? (float)$ratingRaw : 5.0;
            $rating = max(1, min(5, (int) round($rating)));

            $stayDate = $attrs['stay_date'] ?? $attrs['stay'] ?? $attrs['period'] ?? null;
            $stayFormatted = $stayDate ? $this->formatStayDate($stayDate, $locale) : '';

            $out[] = [
                'id'               => $attrs['id'] ?? uniqid('r'),
                'name'             => $attrs['author_name'] ?? $attrs['name'] ?? 'Anonymous',
                'location'         => $attrs['location'] ?? $attrs['city'] ?? '',
                'rating'           => $rating,
                'text'             => $attrs['content'] ?? $attrs['comment'] ?? '',
                'stay'             => $stayFormatted,
                'criteria_ratings' => $attrs['criteria_ratings'] ?? [], // Kriterleri frontend'e iletiyoruz
            ];
        }

        return array_slice($out, 0, 12);
    }

    private function formatStayDate(string $date, string $locale): string
    {
        try {
            $dt = new \DateTimeImmutable($date);
            $formatter = new \IntlDateFormatter(
                $locale === 'de' ? 'de_DE' : ($locale === 'tr' ? 'tr_TR' : 'en_US'),
                \IntlDateFormatter::MEDIUM,
                \IntlDateFormatter::NONE,
                null,
                \IntlDateFormatter::GREGORIAN,
                'MMMM yyyy'
            );

            return $formatter->format($dt);
        } catch (Throwable $e) {
            return $date;
        }
    }

    private function cacheKey(string $locale): string
    {
        $tenant = config('omr.main_tenant') ?: config('omr.tenant_id') ?: 'default';
        return self::CACHE_KEY_PREFIX . $tenant . ':' . strtolower($locale);
    }
}
