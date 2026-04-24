<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SettingsService
{
    private const CACHE_KEY_PREFIX = 'omr_settings_';
    private const SETTINGS_KEYS = [
        'general',
        'contact',
        'social',
        'branding',
        'colors',
        'analytics',
        'seo',
        'performance',
        'email',
        'footer',
        'custom-code',
    ];

    /**
     * Tüm settings'leri API'den çeker
     */
    public function getAll(?string $locale = null): array
    {
        $locale = $locale ?? config('omr.default_locale', 'de');
        $cacheKey = $this->cacheKey('all', $locale);

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($locale) {
            $result = [];

            foreach (self::SETTINGS_KEYS as $key) {
                $result[$key] = $this->fetch($key, $locale);
            }

            return $result;
        });
    }

    /**
     * Tek bir setting grubunu çeker (SettingsController::getSettings kullanır)
     */
    public function get(string $key, ?string $locale = null): array
    {
        $locale = $locale ?? config('omr.default_locale', 'de');
        $tenantId = config('omr.tenant_id') ?: config('omr.main_tenant') ?: '';
        $sectionKey = $key === 'custom_code' ? 'custom-code' : $key;
        $cacheKey = $this->cacheKey($sectionKey, $locale);

        if (!$tenantId) {
            return [];
        }

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($tenantId, $locale, $sectionKey) {
            $settings = \App\Http\Controllers\SettingsController::getSettings($tenantId, $locale);

            return $settings[$sectionKey] ?? [];
        });
    }

    /**
     * Frontend için gerekli settings (SettingsController::getSettings kullanır)
     */
    public function getForFrontend(string $locale): array
    {
        $locale = strtolower($locale);
        $tenantId = config('omr.tenant_id') ?: config('omr.main_tenant') ?: '';
        $cacheKey = $this->cacheKey('frontend', $locale);

        if (!$tenantId) {
            return [
                'general'     => [],
                'contact'     => [],
                'social'      => [],
                'branding'    => [],
                'colors'      => [],
                'footer'      => [],
                'seo'         => [],
                'analytics'   => [],
                'custom_code' => [],
            ];
        }

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($tenantId, $locale) {
            $settings = \App\Http\Controllers\SettingsController::getSettings($tenantId, $locale);

            return [
                'general'     => $settings['general'] ?? [],
                'contact'     => $this->normalizeContact($settings['contact'] ?? []),
                'social'      => $settings['social'] ?? [],
                'branding'    => $this->normalizeBranding($settings['branding'] ?? []),
                'colors'      => $settings['colors'] ?? [],
                'footer'      => $settings['footer'] ?? [],
                'seo'         => $settings['seo'] ?? [],
                'analytics'   => $settings['analytics'] ?? [],
                'custom_code' => $settings['custom-code'] ?? [],
            ];
        });
    }

    /**
     * Cache'i temizle (settings güncellendiğinde)
     */
    public function clearCache(): void
    {
        $tenantId = config('omr.tenant_id') ?: config('omr.main_tenant') ?: '';
        $mainTenant = config('omr.main_tenant') ?: env('OMR_MAIN_TENANT') ?: $tenantId;

        foreach (['de', 'en', 'tr'] as $locale) {
            if ($tenantId) {
                Cache::forget("settings_{$tenantId}_{$locale}_{$mainTenant}");
            }
            foreach (self::SETTINGS_KEYS as $key) {
                Cache::forget($this->cacheKey($key, $locale));
            }
            Cache::forget($this->cacheKey('all', $locale));
            Cache::forget($this->cacheKey('frontend', $locale));
        }
    }

    private function cacheKey(string $suffix, string $locale): string
    {
        $tenantId = config('omr.tenant_id') ?: config('omr.main_tenant') ?: 'default';
        $mainTenant = config('omr.main_tenant') ?: env('OMR_MAIN_TENANT') ?: $tenantId;

        return self::CACHE_KEY_PREFIX . "{$tenantId}:{$mainTenant}:" . strtolower($locale) . ':' . $suffix;
    }

    /**
     * Medya/obje alanlarını URL string'e çevirir (Strapi vb. formatları destekler)
     */
    private function resolveMediaUrl(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
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

    /**
     * Branding: logo, dark_logo, light_logo vb. alanları normalize eder
     */
    private function normalizeBranding(array $data): array
    {
        $base = rtrim(config('omr.base_url'), '/');
        $out = [];

        foreach ($data as $k => $v) {
            if ($k === '_meta') {
                $out[$k] = $v;
                continue;
            }
            if (in_array($k, ['logo', 'dark_logo', 'light_logo', 'favicon', 'logo_light', 'logo_dark'], true)) {
                $resolved = $this->resolveMediaUrl($v);
                $out[$k] = $resolved;
                $out[str_replace('_', '', $k)] = $resolved;
            } else {
                $out[$k] = $v;
            }
        }

        $out['logo_light'] = $out['logo_light'] ?? $out['light_logo'] ?? $out['lightlogo'] ?? null;
        $out['logo_dark'] = $out['logo_dark'] ?? $out['dark_logo'] ?? $out['darklogo'] ?? $out['logo'] ?? null;

        return $out;
    }

    private function allValuesNull(array $data): bool
    {
        foreach ($data as $k => $v) {
            if ($k === '_meta') {
                continue;
            }
            if ($v !== null && $v !== '' && $v !== []) {
                return false;
            }
        }
        return true;
    }

    /**
     * Contact normalizasyonu (public - SettingsController tarafından kullanılır)
     */
    public function normalizeContactPublic(array $data): array
    {
        return $this->normalizeContact($data);
    }

    /**
     * Contact: contact_infos dizisini email, phone, address vb. alanlara dönüştürür
     * API formatı: contact_infos[{ email, phone, mobile, website, address, city, district, country, map, is_primary }]
     */
    private function normalizeContact(array $data): array
    {
        $out = $data;
        $infos = $data['contact_infos'] ?? [];

        if (!is_array($infos) || empty($infos)) {
            return $out;
        }

        $primary = null;
        foreach ($infos as $info) {
            if (!is_array($info)) {
                continue;
            }
            if ($info['is_primary'] ?? false) {
                $primary = $info;
                break;
            }
        }
        $contact = $primary ?? $infos[0];

        $addr = trim($contact['address'] ?? '');
        $city = trim($contact['city'] ?? '');
        $country = trim($contact['country'] ?? '');
        $out['address'] = $addr;
        if ($city || $country) {
            $out['address'] .= ($addr ? "\n" : '') . implode(', ', array_filter([$city, $country]));
        }

        $out['email']   = $contact['email'] ?? $contact['mail'] ?? '';
        $out['phone']   = $contact['phone'] ?? $contact['tel'] ?? $contact['mobile'] ?? '';
        $out['mobile']  = $contact['mobile'] ?? $contact['phone'] ?? '';
        $out['website'] = $contact['website'] ?? $contact['url'] ?? '';
        $out['map']     = $contact['map'] ?? '';

        $out['contact_infos'] = $infos;

        return $out;
    }

    private function normalize(array $data): array
    {
        $out = [];
        foreach ($data as $k => $v) {
            if ($k === '_meta') {
                $out[$k] = $v;
                continue;
            }
            if (is_array($v) && isset($v['url'])) {
                $out[$k] = $this->resolveMediaUrl($v);
            } else {
                $out[$k] = $v;
            }
        }
        return $out;
    }

    private function fetch(string $key, string $locale = 'de'): array
    {
        $base     = rtrim(config('omr.base_url'), '/');
        $endpoint = rtrim(config('omr.endpoint'), '/');
        $tenant   = config('omr.main_tenant') ?: config('omr.tenant_id');

        if (!$tenant || !$base) {
            Log::debug('Settings API: missing config', ['key' => $key]);
            return [];
        }

        $url = "{$base}{$endpoint}/settings/{$key}";

        try {
            $response = Http::timeout(config('omr.timeout', 10))
                ->withHeaders([
                    'X-Tenant-ID' => $tenant,
                    'Accept-Language' => $locale,
                ])
                ->get($url, [
                    'locale' => $locale,
                    'lang'   => $locale,
                ]);

            if (!$response->successful()) {
                Log::debug('Settings API failed', [
                    'key'    => $key,
                    'status' => $response->status(),
                ]);
                return [];
            }

            $json = $response->json();
            $data = $json['data'] ?? $json;

            if (is_array($data) && isset($data['attributes'])) {
                $data = array_merge($data, $data['attributes'] ?? []);
            }

            $result = is_array($data) ? $data : [];

            // Tüm değerler null ise default locale ile tekrar dene
            if ($result && $this->allValuesNull($result) && $locale !== 'en') {
                $fallback = $this->fetch($key, 'en');
                if ($fallback && !$this->allValuesNull($fallback)) {
                    return $fallback;
                }
            }

            return $result;
        } catch (\Throwable $e) {
            Log::debug('Settings API error', [
                'key'   => $key,
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }
    /**
     * API'den aktif dilleri dinamik olarak çeker.
     * @return array
     */
    public function getLanguages(): array
    {
        $cacheKey = $this->cacheKey('active_languages', 'global');

        // Dilleri 24 saat boyunca cache'le (performans için kritik)
        return Cache::remember($cacheKey, now()->addDay(), function () {
            try {
                // Senin verdiğin API uç noktası
                $response = Http::timeout(5)->get('https://omerdogan.de/api/global/settings/languages');

                if ($response->successful()) {
                    $data = $response->json();
                    // API'den gelen diller dizisini döndür
                    return $data['data']['languages'] ?? [];
                }

                Log::error('Settings API Languages fetch failed: ' . $response->status());
                return [];
            } catch (\Throwable $e) {
                Log::error('Settings API Languages error: ' . $e->getMessage());
                return [];
            }
        });
    }
}
