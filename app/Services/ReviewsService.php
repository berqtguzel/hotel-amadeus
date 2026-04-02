<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class ReviewsService
{
    private const CACHE_KEY_PREFIX = 'omr_reviews_';
    private const CRITERIA_LIST_CACHE_KEY = 'omr_review_criteria_list';
    private const CRITERIA_MAP_CACHE_KEY  = 'omr_review_criteria_map';

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
     * Criteria listesini getirir.
     */
 public function getCriteriaList(): array
{
    return Cache::remember('review_criteria_list', now()->addHours(6), function () {

        $url = config('omr.base_url') . config('omr.endpoint') . '/criteria';

        try {
            $res = Http::withHeaders([
                'X-Tenant-ID' => config('omr.tenant_id')
            ])->get($url);

            return $res->json()['data'] ?? [];

        } catch (\Throwable $e) {
            return [];
        }
    });
}

public function getCriteriaMap(): array
{
    return collect($this->getCriteriaList())
        ->pluck('id', 'name')
        ->toArray();
}

    /**
     * Yeni yorum oluşturur.
     */
    public function createReview(array $data): array
    {
        $base     = rtrim(config('omr.base_url'), '/');
        $endpoint = rtrim(config('omr.endpoint'), '/');
        $tenant   = config('omr.main_tenant') ?: config('omr.tenant_id');

        if (!$tenant || !$base) {
            return ['error' => 'Config missing'];
        }

        $url = "{$base}{$endpoint}/reviews";

        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'X-Tenant-ID' => $tenant,
                    'Accept'      => 'application/json',
                ])
                ->post($url, [
                    'author_name'  => $data['author_name'] ?? '',
                    'author_email' => $data['author_email'] ?? '',
                    'review_text'  => $data['content'] ?? '',
                    'rating'       => $data['rating'] ?? 5,
                    'ratings'      => $data['ratings'] ?? [],
                    'stay_date'    => now()->format('Y-m-d'),
                ]);

            if (!$response->successful()) {
                return [
                    'error'   => 'API_REJECTED',
                    'details' => $response->json(),
                ];
            }

            $this->clearCache();

            return $response->json();
        } catch (Throwable $e) {
            return [
                'error'   => 'EXCEPTION',
                'message' => $e->getMessage(),
            ];
        }
    }

    public function clearCache(): void
    {
        foreach (['de', 'en', 'tr'] as $locale) {
            Cache::forget($this->cacheKey($locale));
        }

        Cache::forget(self::CRITERIA_LIST_CACHE_KEY);
        Cache::forget(self::CRITERIA_MAP_CACHE_KEY);
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
                ->withHeaders([
                    'X-Tenant-ID' => $tenant,
                    'Accept'      => 'application/json',
                ])
                ->get($url, [
                    'locale' => $locale,
                    'lang'   => $locale,
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
            if (!is_array($item)) {
                continue;
            }

            $attrs = $item['attributes'] ?? $item;

            if (isset($attrs['status']) && !in_array($attrs['status'], ['approved', 'active'], true)) {
                continue;
            }

            $ratingRaw = $attrs['rating'] ?? $attrs['stars'] ?? 5;
            $rating = is_numeric($ratingRaw) ? (float) $ratingRaw : 5.0;

            if ($rating > 5) {
                $rating = round($rating / 2, 1);
            }

            $rating = max(1, min(5, (int) round($rating)));

            $stayDate = $attrs['stay_date'] ?? $attrs['stay'] ?? $attrs['period'] ?? null;
            $stayFormatted = $stayDate ? $this->formatStayDate($stayDate, $locale) : '';

            $out[] = [
                'id'       => $attrs['id'] ?? uniqid('r'),
                'name'     => $attrs['author_name'] ?? $attrs['name'] ?? 'Anonymous',
                'location' => $attrs['location'] ?? $attrs['city'] ?? '',
                'rating'   => $rating,
                'text'     => $attrs['content'] ?? $attrs['comment'] ?? '',
                'stay'     => $stayFormatted,
                'ratings'  => $attrs['ratings'] ?? [],
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
