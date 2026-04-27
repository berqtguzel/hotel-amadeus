<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class StaffService
{
    private const CACHE_KEY_PREFIX = 'omr_staff_';

    public function getStaff(string $locale): array
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

    private function fetch(string $locale): array
    {
        $base     = rtrim(config('omr.base_url'), '/');
        $endpoint = rtrim(config('omr.endpoint'), '/');
        $tenant   = config('omr.main_tenant') ?: config('omr.tenant_id');

        if (!$tenant || !$base) {
            return [];
        }

        $url = "{$base}{$endpoint}/staff";

        try {
            $response = Http::timeout(10)
                ->withHeaders(['X-Tenant-ID' => $tenant])
                ->get($url, [
                    'locale' => $locale,
                    'lang'   => $locale,
                ]);

            if (!$response->successful()) {
                Log::debug('Staff API failed', ['status' => $response->status()]);
                return [];
            }

            $json = $response->json();
            $data = $this->unwrapStaffPayload($json);

            if (!is_array($data)) {
                return [];
            }

            return $this->normalizeStaff($data);
        } catch (\Throwable $e) {
            Log::debug('Staff API error', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Staff API yanitinda liste bazen data.data altinda gelir.
     *
     * @param  array<string, mixed>  $payload
     * @return array<int, array<string, mixed>>
     */
    private function unwrapStaffPayload(array $payload): array
    {
        $data = $payload['data'] ?? $payload;

        if (is_array($data) && isset($data['data']) && is_array($data['data'])) {
            $data = $data['data'];
        }

        if (!is_array($data) || !array_is_list($data)) {
            return [];
        }

        return array_values(array_filter($data, 'is_array'));
    }

    /**
     * API'den gelen staff verisini TeamGrid formatına uyarlar
     * API formatı: full_name, position, photo, email, phone, social_links, biography, order
     */
    private function normalizeStaff(array $data): array
    {
        $base = rtrim(config('omr.base_url'), '/');
        $out  = [];

        foreach ($data as $item) {
            if (!is_array($item)) {
                continue;
            }
            $attrs = $item['attributes'] ?? $item;
            if (($attrs['status'] ?? 'active') !== 'active') {
                continue;
            }

            $img = $attrs['photo'] ?? $attrs['image'] ?? $attrs['avatar'] ?? $attrs['picture'] ?? null;
            if (is_array($img)) {
                $img = $img['url'] ?? $img['data']['attributes']['url'] ?? null;
            }
            if ($img && !str_starts_with((string) $img, 'http')) {
                $img = $base . (str_starts_with((string) $img, '/') ? '' : '/') . $img;
            }

            $socialLinks = $attrs['social_links'] ?? [];
            $website     = $attrs['website'] ?? $attrs['url'] ?? $attrs['web'] ?? null;
            if (!$website && is_array($socialLinks)) {
                foreach ($socialLinks as $s) {
                    if (!is_array($s)) {
                        continue;
                    }

                    $type = strtolower((string) ($s['type'] ?? $s['platform'] ?? ''));
                    $url  = $s['url'] ?? $s['link'] ?? null;

                    if ($type === 'website' && $url) {
                        $website = $url;
                        break;
                    }
                }
            }

            $out[] = [
                'id'       => $attrs['id'] ?? null,
                'name'     => $attrs['full_name'] ?? $attrs['name'] ?? $attrs['title'] ?? '',
                'title'    => $attrs['position'] ?? $attrs['title'] ?? $attrs['role'] ?? '',
                'email'    => $attrs['email'] ?? $attrs['mail'] ?? '',
                'phone'    => $attrs['phone'] ?? $attrs['tel'] ?? $attrs['telephone'] ?? $attrs['mobile'] ?? '',
                'website'  => $website,
                'image'    => $img,
                'avatar'   => $img,
                'order'    => $attrs['order'] ?? 999,
            ];
        }

        usort($out, fn ($a, $b) => ($a['order'] ?? 999) <=> ($b['order'] ?? 999));

        return $out;
    }

    private function cacheKey(string $locale): string
    {
        $tenant = config('omr.main_tenant') ?: config('omr.tenant_id') ?: 'default';
        $version = config('omr.version', 'v1');

        return self::CACHE_KEY_PREFIX . $version . ':' . $tenant . ':' . strtolower($locale);
    }
}
