<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PartnerService
{
    private const CACHE_KEY_PREFIX = 'omr_partners_';

    /**
     * Tüm partnerleri API'den çeker
     */
    public function getAll(?string $locale = null): array
    {
        $locale = $locale ?? config('omr.default_locale', 'de');
        $cacheKey = $this->cacheKey('all', $locale);

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($locale) {
            return $this->fetch('partners', $locale);
        });
    }

    /**
     * ID veya Slug ile tek bir partner çeker
     */
    public function get(string $identifier, ?string $locale = null): array
    {
        $locale = $locale ?? config('omr.default_locale', 'de');
        $cacheKey = $this->cacheKey("single_{$identifier}", $locale);

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($identifier, $locale) {
            return $this->fetch("partners/{$identifier}", $locale);
        });
    }

    /**
     * Cache'i temizle (Partner güncellendiğinde tetiklenebilir)
     */
    public function clearCache(): void
    {
        foreach (['de', 'en', 'tr'] as $locale) {
            Cache::forget($this->cacheKey('all', $locale));
            // Not: Belirli bir id/slug için olan cache'leri temizlemek adına
            // Redis tags kullanılabilir veya genel liste cache'i silinir.
        }
    }

    private function cacheKey(string $suffix, string $locale): string
    {
        $tenantId = config('omr.tenant_id') ?: config('omr.main_tenant') ?: 'default';
        $mainTenant = config('omr.main_tenant') ?: env('OMR_MAIN_TENANT') ?: $tenantId;
        $version = config('omr.version', 'v1');

        return self::CACHE_KEY_PREFIX . "{$version}:{$tenantId}:{$mainTenant}:" . strtolower($locale) . ':' . $suffix;
    }

    private function fetch(string $endpoint, string $locale = 'de'): array
    {
        $base = rtrim(config('omr.base_url') ?? env('OMR_API_BASE') ?? 'https://omerdogan.de/api', '/');
        $apiEndpoint = rtrim(config('omr.endpoint'), '/');
        $url = "{$base}{$apiEndpoint}/{$endpoint}";
        $tenant = config('omr.main_tenant') ?: config('omr.tenant_id');

        try {
            $response = Http::timeout(config('omr.timeout', 15))
                ->withHeaders([
                    'X-Tenant-ID' => $tenant,
                    'Accept-Language' => $locale,
                    'Accept' => 'application/json',
                ])
                ->get($url, [
                    'locale' => $locale,
                    'lang'   => $locale,
                ]);

            if (!$response->successful()) {
                Log::debug("Partner API failed: {$endpoint}", [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return [];
            }

            $json = $response->json();
            $data = $json['data'] ?? $json;

            return $this->normalizeData($data);
        } catch (\Throwable $e) {
            Log::debug("Partner API error: {$endpoint}", [
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /**
     * API'den gelen veriyi (Strapi vb. formatlardan) düzleştirir ve resimleri URL'e çevirir.
     */
    private function normalizeData($data)
    {
        // Eğer bir listeyse (Collection)
        if (is_array($data) && isset($data[0])) {
            return array_map(function ($item) {
                return $this->flattenAttributes($item);
            }, $data);
        }

        // Eğer tek bir öğeyse (Single Item)
        return $this->flattenAttributes($data);
    }

    private function flattenAttributes($item)
    {
        if (is_array($item) && isset($item['attributes'])) {
            $item = array_merge($item, $item['attributes']);
            unset($item['attributes']);
        }

        return $this->resolveMediaUrls($item);
    }

    /**
     * Partner logolarını ve görsellerini tam URL formatına dönüştürür
     */
    private function resolveMediaUrls($item)
    {
        if (!is_array($item)) return $item;

        foreach ($item as $key => $value) {
            // Partner modellerinde genelde logo, image, cover vb. isimler kullanılır
            if (in_array($key, ['logo', 'dark_logo', 'light_logo', 'image', 'cover', 'thumbnail']) && !empty($value)) {
                $item[$key] = $this->extractUrl($value);
            } elseif (is_array($value)) {
                $item[$key] = $this->resolveMediaUrls($value);
            }
        }
        return $item;
    }

    private function extractUrl($value): ?string
    {
        if (is_string($value)) {
            return $this->ensureAbsoluteUrl($value);
        }
        if (is_array($value)) {
            $url = $value['url'] ?? $value['src'] ?? null;
            if (!$url && isset($value['data']['attributes']['url'])) {
                $url = $value['data']['attributes']['url'];
            }
            if (!$url && isset($value['data']['url'])) {
                $url = $value['data']['url'];
            }
            if ($url) {
                return $this->ensureAbsoluteUrl($url);
            }
        }
        return null;
    }

    private function ensureAbsoluteUrl(string $url): string
    {
        if (str_starts_with($url, 'http://') || str_starts_with($url, 'https://')) {
            return $url;
        }
        $base = rtrim(config('omr.base_url') ?? env('OMR_API_BASE') ?? env('VITE_REMOTE_API_BASE', 'https://omerdogan.de/api'), '/');
        return $base . (str_starts_with($url, '/') ? '' : '/') . $url;
    }
}
