<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GalleryService
{
    private const CACHE_PREFIX = 'omr_galleries_v3_';

    public function getGalleries(string $locale = 'de'): array
    {
        $tenant = config('omr.main_tenant') ?: config('omr.tenant_id') ?: 'default';
        $cacheKey = self::CACHE_PREFIX . config('omr.version', 'v1') . ':' . $tenant . ':' . strtolower($locale);

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($locale) {
            return $this->fetchGalleries($locale);
        });
    }

    private function fetchGalleries(string $locale): array
    {
        $base = rtrim((string) config('omr.base_url'), '/');
        $timeout = (int) config('omr.timeout', 10);
        $tenantId = (string) (config('omr.main_tenant') ?: config('omr.tenant_id'));

        if ($base === '') {
            return [];
        }

        $endpoint = trim((string) config('omr.endpoint', '/v1'), '/');
        $url = $base . '/' . $endpoint . '/galleries';

        try {
            $request = Http::timeout($timeout);

            if ($tenantId !== '') {
                $request = $request->withHeaders([
                    'X-Tenant-ID' => $tenantId,
                ]);
            }

            $response = $request->get($url, [
                'lang' => strtolower($locale),
            ]);

            if (! $response->successful()) {
                return [];
            }

            $json = $response->json();
            $list = $json['data'] ?? [];

            if (! is_array($list)) {
                return [];
            }

            return $this->normalizeGalleries($list);
        } catch (\Throwable $e) {
            Log::debug('Gallery API failed', ['error' => $e->getMessage()]);
            return [];
        }
    }

    private function normalizeGalleries(array $galleries): array
    {
        $normalized = [];

        foreach ($galleries as $gallery) {
            if (! is_array($gallery)) {
                continue;
            }

            $images = [];
            foreach (($gallery['images'] ?? []) as $image) {
                if (! is_array($image)) {
                    continue;
                }

                $url = isset($image['url']) ? trim((string) $image['url']) : '';
                if ($url === '') {
                    continue;
                }

                $images[] = [
                    'id' => $image['id'] ?? null,
                    'url' => $url,
                ];
            }

            if (empty($images)) {
                $coverImage = isset($gallery['cover_image']) ? trim((string) $gallery['cover_image']) : '';
                if ($coverImage !== '') {
                    $images[] = [
                        'id' => null,
                        'url' => $coverImage,
                    ];
                }
            }

            $normalized[] = [
                'id' => $gallery['id'] ?? null,
                'name' => $gallery['name'] ?? '',
                'description' => $gallery['description'] ?? '',
                'images' => $images,
                'image_count' => $gallery['image_count'] ?? count($images),
            ];
        }

        return $normalized;
    }
}
