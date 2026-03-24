<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Services\SettingsService;

class SettingsController extends Controller
{
    /**
     * Resim URL'indeki tenant ID'sini ana tenant ile değiştirir
     */
    private static function replaceImageTenant(?string $imageUrl): ?string
    {
        if (!$imageUrl) {
            return null;
        }

        $mainTenant = config('omr.main_tenant') ?: env('OMR_MAIN_TENANT');
        if (!$mainTenant) {
            return $imageUrl;
        }

        $pattern = '/(\/storage\/)([^\/]+)(\/media\/)/';
        if (preg_match($pattern, $imageUrl, $matches)) {
            $currentTenant = $matches[2];
            if ($currentTenant === $mainTenant) {
                return $imageUrl;
            }
            return preg_replace($pattern, '$1' . $mainTenant . '$3', $imageUrl);
        }

        return $imageUrl;
    }

    /**
     * Logo URL'lerini recursive olarak değiştirir
     */
    private static function replaceLogoImages($data)
    {
        if (is_array($data)) {
            foreach ($data as $key => $value) {
                if (in_array($key, ['logo', 'dark_logo', 'logo_dark', 'light_logo', 'logo_light', 'favicon'])) {
                    if (is_string($value)) {
                        $data[$key] = self::replaceImageTenant($value);
                    } elseif (is_array($value) && isset($value['url']) && is_string($value['url'])) {
                        $data[$key]['url'] = self::replaceImageTenant($value['url']);
                    }
                } elseif (is_array($value)) {
                    $data[$key] = self::replaceLogoImages($value);
                }
            }
        }
        return $data;
    }

    /**
     * Uzak API'den tüm settings bölümlerini çeker ve cache'ler.
     */
    public static function getSettings(string $tenantId, string $locale): array
    {
        $locale = strtolower($locale);
        $mainTenant = config('omr.main_tenant') ?: env('OMR_MAIN_TENANT') ?: $tenantId;
        $cacheKey = "settings_{$tenantId}_{$locale}_{$mainTenant}";

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($tenantId, $locale, $mainTenant) {
            $apiBase = rtrim(config('omr.base_url') ?? env('OMR_API_BASE') ?? env('VITE_REMOTE_API_BASE', 'https://omerdogan.de/api'), '/') . '/v1';

            $sections = [
                'general',
                'seo',
                'branding',
                'colors',
                'contact',
                'social',
                'analytics',
                'performance',
                'email',
                'custom-code',
                'footer',
            ];

            $settings = [];

            foreach ($sections as $section) {
                try {
                    $url = "{$apiBase}/settings/{$section}";
                    $requestTenant = ($section === 'colors') ? $tenantId : $mainTenant;

                    $response = Http::withoutVerifying()
                        ->timeout(config('omr.timeout', 30))
                        ->connectTimeout(10)
                        ->withHeaders([
                            'Accept'      => 'application/json',
                            'X-Tenant-ID' => $requestTenant,
                        ])
                        ->get($url, [
                            'tenant' => $requestTenant,
                            'locale' => $locale,
                        ]);

                    if (!$response->successful()) {
                        Log::warning('Settings API error', [
                            'section' => $section,
                            'status'  => $response->status(),
                            'body'    => $response->body(),
                        ]);
                        $settings[$section] = [];
                        continue;
                    }

                    $json = $response->json();
                    $sectionData = isset($json['data']) ? (array) $json['data'] : [];
                    if (is_array($sectionData) && isset($sectionData['attributes'])) {
                        $sectionData = array_merge($sectionData, $sectionData['attributes'] ?? []);
                    }
                    $settings[$section] = $sectionData;

                } catch (\Throwable $e) {
                    Log::error('Settings API exception', [
                        'section' => $section,
                        'error'   => $e->getMessage(),
                    ]);
                    $settings[$section] = [];
                }
            }

            $settings['branding'] = self::replaceLogoImages($settings['branding'] ?? []);

            return $settings;
        });
    }

    /**
     * Tüm settings'leri döndür
     */
    public function index(Request $request): array
    {
        $locale = $request->query('locale') ?? $request->route('locale') ?? config('omr.default_locale', 'de');
        $tenantId = config('omr.tenant_id') ?: config('omr.main_tenant') ?: '';
        if (!$tenantId) {
            return [];
        }
        return self::getSettings($tenantId, $locale);
    }

    /**
     * Frontend için gerekli settings
     */
    public function frontend(Request $request): array
    {
        $locale = $request->query('locale') ?? $request->route('locale') ?? config('omr.default_locale', 'de');
        $tenantId = config('omr.tenant_id') ?: config('omr.main_tenant') ?: '';
        if (!$tenantId) {
            return $this->emptyFrontendSettings();
        }

        $settings = self::getSettings($tenantId, $locale);

        return [
            'general'     => $settings['general'] ?? [],
            'contact'     => app(SettingsService::class)->normalizeContactPublic($settings['contact'] ?? []),
            'social'      => $settings['social'] ?? [],
            'branding'    => $settings['branding'] ?? [],
            'colors'      => $settings['colors'] ?? [],
            'footer'      => $settings['footer'] ?? [],
            'seo'         => $settings['seo'] ?? [],
            'analytics'   => $settings['analytics'] ?? [],
            'custom_code' => $settings['custom-code'] ?? [],
        ];
    }

    /**
     * Tek bir setting grubu
     */
    public function show(Request $request, string $key): array
    {
        $locale = $request->query('locale') ?? $request->route('locale') ?? config('omr.default_locale', 'de');
        $tenantId = config('omr.tenant_id') ?: config('omr.main_tenant') ?: '';
        if (!$tenantId) {
            return [];
        }

        $settings = self::getSettings($tenantId, $locale);
        $sectionKey = $key === 'custom_code' ? 'custom-code' : $key;

        return $settings[$sectionKey] ?? [];
    }

    /**
     * Cache temizle
     */
    public function clearCache(): array
    {
        $tenantId = config('omr.tenant_id') ?: config('omr.main_tenant') ?: '';
        $mainTenant = config('omr.main_tenant') ?: env('OMR_MAIN_TENANT') ?: $tenantId;

        foreach (['de', 'en', 'tr'] as $locale) {
            if ($tenantId) {
                Cache::forget("settings_{$tenantId}_{$locale}_{$mainTenant}");
            }
        }

        app(SettingsService::class)->clearCache();

        return ['success' => true, 'message' => 'Settings cache cleared'];
    }

    private function emptyFrontendSettings(): array
    {
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
}
