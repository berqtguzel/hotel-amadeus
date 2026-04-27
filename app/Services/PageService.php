<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PageService
{
    private const CACHE_PREFIX = 'omr_page_';

    public function getPage(string $slug, string $locale): ?array
    {
        $cacheKey = $this->cacheKey($locale, $slug);

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($slug, $locale) {
            return $this->fetchPage($slug, $locale);
        });
    }

    public function getPages(string $locale): array
    {
        $cacheKey = $this->listCacheKey($locale);

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($locale) {
            return $this->fetchPages($locale);
        });
    }

    private function fetchPage(string $slug, string $locale): ?array
    {
        $base = rtrim(config('omr.base_url'), '/');
        $endpoint = rtrim(config('omr.endpoint'), '/');
        $tenant = config('omr.tenant_id');

        if (!$tenant || !$base) {
            return null;
        }

        try {
            $response = Http::timeout(10)
                ->withHeaders(['X-Tenant-ID' => $tenant])
                ->get("{$base}{$endpoint}/pages/{$slug}", [
                    'lang' => $locale,
                ]);

            if ($response->successful()) {
                $json = $response->json();
                $data = $json['data'] ?? $json;
                return $this->normalizePage($data, $slug, $locale);
            }
        } catch (\Throwable $e) {
            Log::debug('Page API failed', ['slug' => $slug, 'error' => $e->getMessage()]);
        }

        return null;
    }

    private function fetchPages(string $locale): array
    {
        $base = rtrim(config('omr.base_url'), '/');
        $endpoint = rtrim(config('omr.endpoint'), '/');
        $tenant = config('omr.tenant_id');

        if (!$tenant || !$base) {
            return [];
        }

        try {
            $response = Http::timeout(10)
                ->withHeaders(['X-Tenant-ID' => $tenant])
                ->get("{$base}{$endpoint}/pages", [
                    'lang' => $locale,
                ]);

            if ($response->successful()) {
                $json = $response->json();
                return $json['data'] ?? $json ?? [];
            }
        } catch (\Throwable $e) {
            Log::debug('Pages list API failed', ['error' => $e->getMessage()]);
        }

        return [];
    }

    private function normalizePage(array $data, string $slug, string $locale): array
    {
        $trans = $this->pickTranslation($data['translations'] ?? [], $locale);

        return [
            'id' => $data['id'] ?? null,
            'slug' => $data['slug'] ?? $slug,
            'title' => $trans['title'] ?? $data['title'] ?? ucfirst($slug),
            'subtitle' => $trans['subtitle'] ?? $data['subtitle'] ?? '',
            'content' => $trans['content'] ?? $data['content'] ?? '',
            'heroImage' => $data['hero_image'] ?? $data['image'] ?? $data['heroImage'] ?? null,
            'blocks' => $data['blocks'] ?? [],
            'locale' => $locale,
            'is_demo' => false,
            'meta' => $this->normalizeMeta($data, $trans),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array<string, mixed>  $trans
     * @return array<string, mixed|null>
     */
    private function normalizeMeta(array $data, array $trans): array
    {
        $merged = [];

        foreach (['meta', 'seo'] as $key) {
            foreach ([$data[$key] ?? null, $trans[$key] ?? null] as $blob) {
                if (is_array($blob)) {
                    $merged = array_merge($merged, $blob);
                }
            }
        }

        $pick = function (array $keys) use ($merged, $data, $trans) {
            foreach ($keys as $k) {
                if (isset($merged[$k]) && $merged[$k] !== '' && $merged[$k] !== null) {
                    return $merged[$k];
                }
            }
            foreach ($keys as $k) {
                if (isset($data[$k]) && $data[$k] !== '' && $data[$k] !== null) {
                    return $data[$k];
                }
                if (isset($trans[$k]) && $trans[$k] !== '' && $trans[$k] !== null) {
                    return $trans[$k];
                }
            }

            return null;
        };

        return [
            'title' => $pick(['title', 'meta_title', 'metaTitle']),
            'description' => $pick(['description', 'meta_description', 'metaDescription']),
            'keywords' => $pick(['keywords', 'meta_keywords', 'metaKeywords']),
            'og_title' => $pick(['og_title', 'ogTitle']),
            'og_description' => $pick(['og_description', 'ogDescription']),
            'og_image' => $pick(['og_image', 'ogImage', 'image', 'hero_image']),
            'og_type' => $pick(['og_type', 'ogType']) ?? 'website',
            'twitter_card' => $pick(['twitter_card', 'twitterCard']) ?? 'summary_large_image',
            'twitter_title' => $pick(['twitter_title', 'twitterTitle']),
            'twitter_description' => $pick(['twitter_description', 'twitterDescription']),
            'twitter_image' => $pick(['twitter_image', 'twitterImage']),
            'canonical_url' => $pick(['canonical_url', 'canonicalUrl', 'url']),
        ];
    }

    private function pickTranslation(array $translations, string $locale): array
    {
        foreach ($translations as $t) {
            $code = $t['language_code'] ?? $t['locale'] ?? '';
            if (strtolower($code) === strtolower($locale)) {
                return $t;
            }
        }
        return $translations[0] ?? [];
    }

    public function clearCache(?string $slug = null): void
    {
        if ($slug) {
            foreach (['de', 'en', 'tr'] as $locale) {
                Cache::forget($this->cacheKey($locale, $slug));
            }
        } else {
            foreach (['de', 'en', 'tr'] as $locale) {
                Cache::forget($this->listCacheKey($locale));
            }
        }
    }

    private function cacheKey(string $locale, string $slug): string
    {
        $tenant = config('omr.main_tenant') ?: config('omr.tenant_id') ?: 'default';
        $version = config('omr.version', 'v1');

        return self::CACHE_PREFIX . $version . ':' . $tenant . ':' . strtolower($locale) . ':' . strtolower($slug);
    }

    private function listCacheKey(string $locale): string
    {
        $tenant = config('omr.main_tenant') ?: config('omr.tenant_id') ?: 'default';
        $version = config('omr.version', 'v1');

        return self::CACHE_PREFIX . $version . ':' . $tenant . ':list:' . strtolower($locale);
    }
}
