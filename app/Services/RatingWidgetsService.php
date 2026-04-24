<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RatingWidgetsService
{
    private const CACHE_PREFIX = 'omr_rating_widgets_';

    public function getRatings(string $locale): array
    {
        $cacheKey = $this->cacheKey($locale);

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($locale) {
            return $this->fetchRatings($locale);
        });
    }

    private function fetchRatings(string $locale): array
    {
        $base = rtrim(config('omr.base_url'), '/');
        $endpoint = rtrim(config('omr.endpoint'), '/');
        $tenant = config('omr.tenant_id');

        if (!$tenant || !$base) {
            return [];
        }

        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'X-Tenant-ID' => $tenant,
                ])
                ->get("{$base}{$endpoint}/external-ratings", [
                    'lang' => $locale,
                ]);

            if ($response->successful()) {
                $json = $response->json();
                $data = $json['data'] ?? [];
                $ratings = $data['ratings'] ?? [];
                $meta = $data['_meta'] ?? [];

                return [
                    'ratings' => $this->normalizeRatings($ratings),
                    'meta' => $meta,
                ];
            }
        } catch (\Throwable $e) {
            Log::debug('External ratings API failed', [
                'locale' => $locale,
                'error' => $e->getMessage(),
            ]);
        }

        return [];
    }

    private function normalizeRatings(array $ratings): array
    {
        return array_map(function (array $item) {
            return [
                'id' => $item['id'] ?? null,
                'platform' => $item['platform'] ?? null,
                'platform_name' => $item['platform_name'] ?? ucfirst((string) ($item['platform'] ?? '')),
                'source_url' => $item['source_url'] ?? null,
                'logo_url' => $item['logo_url'] ?? null,
                'bg_color' => $item['bg_color'] ?? null,
                'text_color' => $item['text_color'] ?? null,
                'rating_normalized' => $item['rating_normalized'] ?? null,
                'original_rating' => $item['original_rating'] ?? null,
                'max_rating' => $item['max_rating'] ?? null,
                'display' => $item['display'] ?? null,
                'last_updated' => $item['last_updated'] ?? null,
                'fetch_ok' => (bool) ($item['fetch_ok'] ?? false),
                'last_error' => $item['last_error'] ?? null,
            ];
        }, $ratings);
    }

    public function clearCache(): void
    {
        foreach (['de', 'en', 'tr'] as $locale) {
            Cache::forget($this->cacheKey($locale));
        }
    }

    private function cacheKey(string $locale): string
    {
        $tenant = config('omr.main_tenant') ?: config('omr.tenant_id') ?: 'default';

        return self::CACHE_PREFIX . $tenant . ':' . strtolower($locale);
    }
}
