<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class HolidayThemeService
{
    private const CACHE_KEY_PREFIX = 'omr_holiday_themes_v2_';

    public function getThemes(string $locale): array
    {
        $locale = strtolower($locale);
        $cacheKey = $this->cacheKey($locale);

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($locale) {
            return $this->fetch($locale);
        });
    }

    public function clearCache(): void
    {
        foreach (['de', 'en', 'tr'] as $locale) {
            Cache::forget($this->cacheKey($locale));
        }
    }

    /**
     * @param array<int, array<string, mixed>> $themes
     * @return array{offers: array<int, array<string, mixed>>, travelThemes: array<int, array<string, mixed>>}
     */
    public function splitThemesByFile(array $themes): array
    {
        $offers = [];
        $travelThemes = [];

        foreach ($themes as $theme) {
            if (! is_array($theme)) {
                continue;
            }

            if ($this->hasFile($theme)) {
                $offers[] = $theme;
            } else {
                $travelThemes[] = $theme;
            }
        }

        return [
            'offers' => array_values($offers),
            'travelThemes' => array_values($travelThemes),
        ];
    }

    private function fetch(string $locale): array
    {
        $base = rtrim((string) config('omr.base_url'), '/');
        $endpoint = rtrim((string) config('omr.endpoint'), '/');
        $tenant = config('omr.main_tenant') ?: config('omr.tenant_id');

        if (! $tenant || ! $base) {
            return [];
        }

        $url = "{$base}{$endpoint}/holiday-themes";

        try {
            $pages = $this->fetchAllPages($url, $locale, $tenant);

            if ($pages === []) {
                return [];
            }

            return $this->normalize($pages, $base);
        } catch (\Throwable $e) {
            Log::debug('Holiday themes API error', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function fetchAllPages(string $url, string $locale, string $tenant): array
    {
        $firstPage = $this->requestPage($url, $locale, $tenant, 1);

        if ($firstPage === null) {
            return [];
        }

        $items = $firstPage['items'];
        $lastPage = max(1, (int) ($firstPage['last_page'] ?? 1));

        if ($lastPage <= 1) {
            return $items;
        }

        for ($page = 2; $page <= $lastPage; $page++) {
            $result = $this->requestPage($url, $locale, $tenant, $page);

            if ($result === null) {
                continue;
            }

            $items = array_merge($items, $result['items']);
        }

        return $this->dedupeItems($items);
    }

    /**
     * @return array{items: array<int, array<string, mixed>>, last_page: int}|null
     */
    private function requestPage(string $url, string $locale, string $tenant, int $page): ?array
    {
        $response = Http::timeout(10)
            ->withHeaders(['X-Tenant-ID' => $tenant])
            ->get($url, [
                'locale' => $locale,
                'lang' => $locale,
                'page' => $page,
                'per_page' => 100,
            ]);

        if (! $response->successful()) {
            Log::debug('Holiday themes API failed', [
                'status' => $response->status(),
                'page' => $page,
            ]);

            return null;
        }

        $json = $response->json();

        return [
            'items' => $this->unwrapPayload($json),
            'last_page' => $this->extractLastPage($json),
        ];
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<int, array<string, mixed>>
     */
    private function unwrapPayload(array $payload): array
    {
        $data = $payload['data'] ?? $payload;

        if (is_array($data) && isset($data['data']) && is_array($data['data'])) {
            $data = $data['data'];
        }

        if (! is_array($data) || ! array_is_list($data)) {
            return [];
        }

        return array_values(array_filter($data, 'is_array'));
    }

    private function extractLastPage(array $payload): int
    {
        $data = $payload['data'] ?? $payload;

        if (is_array($data)) {
            $pagination = $data['pagination'] ?? null;

            if (is_array($pagination) && isset($pagination['last_page'])) {
                return max(1, (int) $pagination['last_page']);
            }

            if (isset($data['last_page'])) {
                return max(1, (int) $data['last_page']);
            }
        }

        return 1;
    }

    /**
     * @param array<int, array<string, mixed>> $items
     * @return array<int, array<string, mixed>>
     */
    private function normalize(array $items, string $base): array
    {
        $out = [];

        foreach ($items as $item) {
            $attrs = $item['attributes'] ?? $item;

            if (! is_array($attrs)) {
                continue;
            }

            $name = trim((string) ($attrs['name'] ?? $attrs['title'] ?? ''));
            if ($name === '') {
                continue;
            }

            $image = $this->absoluteUrl(
                $attrs['image'] ?? $attrs['photo'] ?? $attrs['cover_image'] ?? null,
                $base,
            );
            $file = $this->absoluteUrl(
                $attrs['file'] ?? $attrs['document'] ?? $attrs['pdf'] ?? null,
                $base,
            );

            $description = trim((string) ($attrs['description'] ?? ''));

            $out[] = [
                'id' => $attrs['id'] ?? null,
                'slug' => $attrs['slug'] ?? Str::slug($name),
                'name' => $name,
                'description' => $description,
                'excerpt' => Str::limit($description, 140),
                'image' => $image ?: '/images/template3.png',
                'file' => $file,
                'created_at' => $attrs['created_at'] ?? null,
            ];
        }

        usort($out, function ($a, $b) {
            return strcmp((string) ($b['created_at'] ?? ''), (string) ($a['created_at'] ?? ''));
        });

        return $out;
    }

    private function absoluteUrl(mixed $value, string $base): ?string
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        $value = trim($value);

        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return $value;
        }

        return $base . (str_starts_with($value, '/') ? '' : '/') . $value;
    }

    /**
     * @param array<int, array<string, mixed>> $items
     * @return array<int, array<string, mixed>>
     */
    private function dedupeItems(array $items): array
    {
        $seen = [];
        $deduped = [];

        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }

            $key = (string) ($item['id'] ?? ($item['slug'] ?? md5(json_encode($item))));

            if (isset($seen[$key])) {
                continue;
            }

            $seen[$key] = true;
            $deduped[] = $item;
        }

        return $deduped;
    }

    /**
     * @param array<string, mixed> $theme
     */
    private function hasFile(array $theme): bool
    {
        $file = $theme['file'] ?? null;

        return is_string($file) && trim($file) !== '';
    }

    private function cacheKey(string $locale): string
    {
        $tenant = config('omr.main_tenant') ?: config('omr.tenant_id') ?: 'default';
        $version = config('omr.version', 'v1');

        return self::CACHE_KEY_PREFIX . $version . ':' . $tenant . ':' . strtolower($locale);
    }
}
