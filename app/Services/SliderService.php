<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SliderService
{
    private const CACHE_KEY_PREFIX = 'omr_slider_';
    private const CACHE_VERSION = 2;
    private const FALLBACK_SLUGS = ['hero', 'experience', 'home', 'main', 'default'];

    public function getSlider(string $slug, string $locale): ?array
    {
        $locale = strtolower($locale);
        $slug   = strtolower($slug);
        $cacheKey = $this->cacheKey($locale, $slug);

        $result = Cache::remember($cacheKey, now()->addDays(7), function () use ($slug, $locale) {
            $data = $this->fetch($slug, $locale);
            if ($data !== null) {
                return $data;
            }
            foreach (self::FALLBACK_SLUGS as $fallback) {
                if ($fallback === $slug) {
                    continue;
                }
                $data = $this->fetch($fallback, $locale);
                if ($data !== null) {
                    return $data;
                }
            }
            $data = $this->fetchList($locale);
            if ($data !== null) {
                return $data;
            }
            return null;
        });

        if ($result === null) {
            Cache::forget($cacheKey);
        }

        return $result;
    }

    public function clearCache(?string $slug = null): void
    {
        if ($slug) {
            foreach (['de', 'en', 'tr'] as $locale) {
                Cache::forget($this->cacheKey($locale, strtolower($slug)));
            }
        } else {
            foreach (['de', 'en', 'tr'] as $locale) {
                foreach (self::FALLBACK_SLUGS as $s) {
                    Cache::forget($this->cacheKey($locale, $s));
                }
            }
        }
    }

    private function fetch(string $slug, string $locale): ?array
    {
        $base     = rtrim(config('omr.base_url'), '/');
        $endpoint = rtrim(config('omr.endpoint'), '/');
        $tenant   = config('omr.main_tenant') ?: config('omr.tenant_id');

        if (!$base) {
            Log::debug('Slider API: OMR_API_BASE missing');
            return null;
        }

        if (!$tenant) {
            Log::debug('Slider API: OMR_TENANT_ID / OMR_MAIN_TENANT missing');
            return null;
        }

        $paths = [
            "{$base}{$endpoint}/sliders/{$slug}",
            "{$base}{$endpoint}/slider/{$slug}",
        ];

        foreach ($paths as $url) {
            $data = $this->doFetch($url, $slug, $locale, $tenant, $base);
            if ($data !== null) {
                return $data;
            }
        }

        return null;
    }

    private function doFetch(string $url, string $slug, string $locale, string $tenant, string $base): ?array
    {
        try {
            $response = Http::timeout(config('omr.timeout', 10))
                ->withHeaders([
                    'X-Tenant-ID'      => $tenant,
                    'Accept-Language'  => $locale,
                ])
                ->get($url, [
                    'locale' => $locale,
                    'lang'   => $locale,
                ]);

            if (!$response->successful()) {
                return null;
            }

            $json = $response->json();
            $data = $json['data'] ?? $json;

            if (!is_array($data)) {
                return null;
            }

            $data = self::fixStorageUrls($data);

            return $this->normalize($data, $base);
        } catch (\Throwable $e) {
            return null;
        }
    }


/**
 * GET /v1/sliders - Tüm slider listesini çeker ve normalize eder
 */
private function fetchList(string $locale): ?array
{
    $base     = rtrim(config('omr.base_url'), '/');
    $endpoint = rtrim(config('omr.endpoint'), '/');
    $tenant   = config('omr.main_tenant') ?: config('omr.tenant_id');

    if (!$base || !$tenant) {
        return null;
    }

    $url = "{$base}{$endpoint}/sliders";

    try {
        $response = Http::timeout(config('omr.timeout', 10))
            ->withHeaders([
                'X-Tenant-ID'      => $tenant,
                'Accept-Language'  => $locale,
            ])
            ->get($url, ['locale' => $locale, 'lang' => $locale]);

        if (!$response->successful()) {
            return null;
        }

        $json = $response->json();
        $list = $json['data'] ?? $json;

        if (!is_array($list)) {
            return null;
        }

        // URL'leri düzelt
        $list = self::fixStorageUrls($list);

        // ÖNEMLİ: Burada tek bir objeyi değil, tüm listeyi normalize metoduna gönderiyoruz
        // normalize metodu içindeki mantığı diziye göre uyarlayacağız.
        return $this->normalize($list, $base);
    } catch (\Throwable $e) {
        Log::error('SliderService List Fetch Error: ' . $e->getMessage());
        return null;
    }
}

    /** /storage/ path'leri için domain kökü - api base değil */
    private static function storageBase(string $apiBase): string
    {
        $mediaBase = config('omr.video_base_url');
        if ($mediaBase) {
            return rtrim($mediaBase, '/');
        }
        $parsed = parse_url(rtrim($apiBase, '/'));
        $scheme = $parsed['scheme'] ?? 'https';
        $host   = $parsed['host'] ?? '';
        return "{$scheme}://{$host}";
    }

    private function normalize(array $data, string $base): array
{
    // Eğer gelen veri bir liste (birden fazla slider) ise
    if (isset($data[0]) && is_array($data[0])) {
        $allSliders = [];
        foreach ($data as $sliderData) {
            $allSliders[] = $this->formatSingleSlider($sliderData, $base);
        }
        return [
            'is_list' => true,
            'sliders' => $allSliders
        ];
    }

    // Eğer tek bir slider objesi ise
    return $this->formatSingleSlider($data, $base);
}

/**
 * Tek bir slider objesini ve içindeki slide'ları formatlar
 */
private function formatSingleSlider(array $data, string $base): array
{
    $attrs = $data['attributes'] ?? $data;
    $items = $attrs['items'] ?? $attrs['slides'] ?? $attrs['images'] ?? null;

    // Eğer iç itemlar yoksa ama datanın kendisi bir listeyse (slides dizisi direkt dataysa)
    if ($items === null && isset($data[0])) {
        $items = $data;
    }

    $items = $items ?? [$data];
    $storageBase = self::storageBase($base);
    $videoExtensions = ['mp4', 'webm', 'ogg', 'mov'];
    $slides = [];

    foreach ($items as $item) {
        if (!is_array($item)) continue;

        $sAttrs = $item['attributes'] ?? $item;
        $img    = $sAttrs['image'] ?? $sAttrs['url'] ?? $sAttrs['src'] ?? $sAttrs['media'] ?? null;
        $vid    = $sAttrs['video'] ?? $sAttrs['video_url'] ?? $sAttrs['media_url'] ?? null;

        // Resim Normalizasyonu
        if (is_array($img)) {
            $img = $img['url'] ?? $img['data']['attributes']['url'] ?? null;
        }
        if ($img && is_string($img) && !str_starts_with($img, 'http')) {
            $prefix = (str_starts_with($img, '/storage/') ? $storageBase : $base);
            $img = $prefix . (str_starts_with($img, '/') ? '' : '/') . $img;
        }

        // Video Normalizasyonu
        if (is_array($vid)) {
            $vid = $vid['url'] ?? $vid['src'] ?? $vid['data']['attributes']['url'] ?? null;
        }
        if ($vid && is_string($vid) && !str_starts_with($vid, 'http')) {
            $prefix = (str_starts_with($vid, '/storage/') || str_contains($vid, '/api/storage/') ? $storageBase : $base);
            $vid = $prefix . (str_starts_with($vid, '/') ? '' : '/') . str_replace('/api/storage/', '/storage/', $vid);
        }

        // Uzantıdan Video Kontrolü
        $urlAttr = $sAttrs['url'] ?? $sAttrs['src'] ?? null;
        if (!$vid && $urlAttr && is_string($urlAttr)) {
            $ext = strtolower(pathinfo(parse_url($urlAttr, PHP_URL_PATH) ?: '', PATHINFO_EXTENSION));
            if (in_array($ext, $videoExtensions, true)) {
                $vid = $urlAttr;
            }
        }

        $slides[] = [
            'image'       => $img,
            'video'       => $vid,
            'poster'      => $sAttrs['poster'] ?? $sAttrs['thumbnail'] ?? $img ?? null,
            'title'       => $sAttrs['title'] ?? $sAttrs['heading'] ?? '',
            'description' => $sAttrs['description'] ?? $sAttrs['content'] ?? $sAttrs['text'] ?? '',
            'link'        => $sAttrs['link'] ?? $sAttrs['url'] ?? null,
            'alt'         => $sAttrs['alt'] ?? $sAttrs['title'] ?? '',
        ];
    }

    return [
        'id'     => $data['id'] ?? null,
        'slug'   => $data['slug'] ?? null,
        'title'  => $data['title'] ?? $data['name'] ?? null,
        'slides' => $slides,
    ];
}
    /**
     * Recursively replace "/api/storage/" with "/storage/" in all string values.
     * Handles both relative paths and full URLs.
     */
    private static function fixStorageUrls(mixed $data): mixed
    {
        if (is_array($data)) {
            return array_map([self::class, 'fixStorageUrls'], $data);
        }

        if (is_string($data)) {
            return str_replace('/api/storage/', '/storage/', $data);
        }

        return $data;
    }

    private function cacheKey(string $locale, string $slug): string
    {
        $tenant = config('omr.main_tenant') ?: config('omr.tenant_id') ?: 'default';
        $version = config('omr.version', 'v1');

        return self::CACHE_KEY_PREFIX . 'v' . self::CACHE_VERSION . ":{$version}:{$tenant}:" . strtolower($locale) . ':' . strtolower($slug);
    }
}
