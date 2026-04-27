<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HotelService
{
    private const CACHE_KEY_PREFIX = 'omr_hotels_';

    public function getHotels(): array
    {
        $base = rtrim(config('omr.base_url'), '/');
        $endpoint = rtrim(config('omr.endpoint'), '/');
        $tenant = config('omr.main_tenant') ?: config('omr.tenant_id');

        if (!$tenant) {
            Log::error('HotelService: OMR_TENANT_ID eksik!');
            return [];
        }

        $cacheKey = $this->cacheKey();

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($base, $endpoint, $tenant) {
            try {
                $url = "{$base}{$endpoint}/hotels";

                $response = Http::timeout(10)
                    ->withHeaders(['X-Tenant-ID' => $tenant])
                    ->get($url);

                if (!$response->successful()) {
                    Log::warning('Hotel API Hatası', ['status' => $response->status()]);
                    return [];
                }

                $json = $response->json();

                return $this->normalizeHotels($json['data'] ?? [], $base);

            } catch (\Throwable $e) {
                Log::error('Hotels çekilirken hata: ' . $e->getMessage());
                return [];
            }
        });
    }

    public function clearCache(): void
    {
        Cache::forget($this->cacheKey());
    }

    private function normalizeHotels(array $payload, string $base): array
    {
        $items = $this->unwrapPayload($payload);

        return array_values(array_filter(array_map(function ($item) use ($base) {
            if (!is_array($item)) {
                return null;
            }

            $attrs = $item['attributes'] ?? $item;
            $name = trim((string) ($attrs['name'] ?? $attrs['title'] ?? ''));

            if ($name === '') {
                return null;
            }

            $coverImage = $this->absoluteUrl(
                $attrs['cover_image'] ?? $attrs['image'] ?? $attrs['hero_image'] ?? null,
                $base,
            );

            $services = $attrs['services'] ?? $attrs['amenities'] ?? [];
            $amenities = [];

            if (is_string($services) && trim($services) !== '') {
                $amenities = array_values(array_filter(array_map('trim', explode(',', $services))));
            } elseif (is_array($services)) {
                $amenities = array_values(array_filter(array_map(function ($service) {
                    if (is_string($service)) {
                        return trim($service);
                    }

                    if (is_array($service)) {
                        return $service['name'] ?? $service['title'] ?? null;
                    }

                    return null;
                }, $services)));
            }

            return [
                'id' => $attrs['id'] ?? null,
                'slug' => $attrs['slug'] ?? null,
                'name' => $name,
                'description' => (string) ($attrs['description'] ?? ''),
                'location' => (string) ($attrs['location'] ?? $attrs['city'] ?? ''),
                'stars' => is_numeric($attrs['stars'] ?? null) ? (float) $attrs['stars'] : 0,
                'cover_image' => $coverImage ?: '/images/template1.png',
                'email' => $attrs['email'] ?? $attrs['mail'] ?? '',
                'phone' => $attrs['phone'] ?? $attrs['tel'] ?? $attrs['telephone'] ?? '',
                'website' => $attrs['website'] ?? $attrs['url'] ?? '',
                'website_link' => $attrs['website_link'] ?? $attrs['website'] ?? $attrs['url'] ?? '',
                'services' => implode(', ', $amenities),
                'amenities' => $amenities,
            ];
        }, $items)));
    }

    private function unwrapPayload(array $payload): array
    {
        if (array_is_list($payload)) {
            return $payload;
        }

        $data = $payload['data'] ?? null;

        if (is_array($data) && array_is_list($data)) {
            return $data;
        }

        return [];
    }

    private function absoluteUrl(mixed $value, string $base): ?string
    {
        if (!is_string($value) || trim($value) === '') {
            return null;
        }

        $value = trim($value);

        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return $value;
        }

        return $base . (str_starts_with($value, '/') ? '' : '/') . $value;
    }

    private function cacheKey(): string
    {
        $tenant = config('omr.main_tenant') ?: config('omr.tenant_id') ?: 'default';
        $version = config('omr.version', 'v1');

        return self::CACHE_KEY_PREFIX . $version . ':' . $tenant;
    }
}
