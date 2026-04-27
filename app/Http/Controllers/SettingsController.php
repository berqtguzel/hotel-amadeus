<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Services\SettingsService;

class SettingsController extends Controller
{
    private static array $requestCache = [];

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

    public static function getSettings(string $tenantId, string $locale): array
    {
        $locale = strtolower($locale);
        $mainTenant = config('omr.main_tenant') ?: env('OMR_MAIN_TENANT') ?: $tenantId;
        $version = config('omr.version', 'v1');
        $cacheKey = "settings_{$version}_{$tenantId}_{$locale}_{$mainTenant}";

        if (isset(self::$requestCache[$cacheKey])) {
            return self::$requestCache[$cacheKey];
        }

        $settings = Cache::remember($cacheKey, now()->addDays(7), function () use ($tenantId, $locale, $mainTenant) {
            if (strtolower((string) config('omr.version')) === 'v2') {
                return self::getFlatSettings($tenantId, $locale, $mainTenant);
            }

            $apiBase = rtrim(config('omr.base_url') ?? env('OMR_API_BASE') ?? env('VITE_REMOTE_API_BASE', 'https://omerdogan.de/api'), '/')
                . rtrim(config('omr.endpoint'), '/');

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

        self::$requestCache[$cacheKey] = $settings;

        return $settings;
    }

    private static function getFlatSettings(string $tenantId, string $locale, string $mainTenant): array
    {
        $base = rtrim(config('omr.base_url') ?? env('OMR_API_BASE') ?? 'https://omerdogan.de/api', '/');
        $endpoint = rtrim(config('omr.endpoint'), '/');
        $url = "{$base}{$endpoint}/settings";

        try {
            $response = Http::withoutVerifying()
                ->timeout(config('omr.timeout', 30))
                ->connectTimeout(10)
                ->withHeaders([
                    'Accept' => 'application/json',
                    'X-Tenant-ID' => $mainTenant,
                ])
                ->get($url, [
                    'tenant' => $mainTenant,
                    'locale' => $locale,
                ]);

            if (!$response->successful()) {
                Log::warning('Flat Settings API error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return self::emptySettingsPayload();
            }

            $items = $response->json('data') ?? [];

            return self::mapFlatSettings(is_array($items) ? $items : [], $tenantId, $mainTenant, $locale);
        } catch (\Throwable $e) {
            Log::error('Flat Settings API exception', ['error' => $e->getMessage()]);

            return self::emptySettingsPayload();
        }
    }

    private static function mapFlatSettings(array $items, string $tenantId, string $mainTenant, string $locale): array
    {
        $flat = [];

        foreach ($items as $item) {
            if (!is_array($item) || !isset($item['key'])) {
                continue;
            }

            $flat[(string) $item['key']] = $item['value'] ?? null;
        }

        $logo = self::resolveMediaValue($flat['site_logo'] ?? null, $mainTenant);
        $darkLogo = self::resolveMediaValue($flat['site_dark_logo'] ?? null, $mainTenant) ?: $logo;
        $favicon = self::resolveMediaValue($flat['site_favicon'] ?? null, $mainTenant);

        $colors = array_intersect_key($flat, array_flip([
            'site_primary_color',
            'site_secondary_color',
            'site_accent_color',
            'button_color',
            'text_color',
            'h1_color',
            'h2_color',
            'h3_color',
            'link_color',
            'background_color',
            'header_background_color',
            'footer_background_color',
        ]));

        $contact = self::fetchVersionedSettingSection('contact', $mainTenant, 'v1', $locale);

        return [
            'general' => [
                'site_name' => $flat['site_name'] ?? null,
                'site_description' => $flat['site_description'] ?? null,
                'site_keywords' => $flat['site_keywords'] ?? null,
            ],
            'seo' => [
                'title' => $flat['site_name'] ?? null,
                'description' => $flat['site_description'] ?? null,
                'keywords' => $flat['site_keywords'] ?? null,
            ],
            'branding' => array_filter([
                'site_name' => $flat['site_name'] ?? null,
                'siteName' => $flat['site_name'] ?? null,
                'site_description' => $flat['site_description'] ?? null,
                'logo' => $logo,
                'logo_light' => $logo,
                'light_logo' => $logo,
                'logo_dark' => $darkLogo,
                'dark_logo' => $darkLogo,
                'favicon' => $favicon,
            ], fn ($value) => $value !== null && $value !== ''),
            'colors' => $colors,
            'contact' => $contact,
            'social' => [],
            'analytics' => [],
            'performance' => [
                'cache_duration' => $flat['cache_duration'] ?? null,
                'enable_caching' => $flat['enable_caching'] ?? null,
                'minify_css' => $flat['minify_css'] ?? null,
                'minify_js' => $flat['minify_js'] ?? null,
                'lazy_loading' => $flat['lazy_loading'] ?? null,
            ],
            'email' => [
                'email_notifications' => $flat['email_notifications'] ?? null,
            ],
            'custom-code' => [],
            'footer' => [
                'footer_text' => $flat['footer_text'] ?? null,
                'footer_copyright' => $flat['footer_copyright'] ?? null,
            ],
        ];
    }

    private static function fetchVersionedSettingSection(string $section, string $tenant, ?string $version = null, ?string $locale = null): array
    {
        $base = rtrim(config('omr.base_url') ?? env('OMR_API_BASE') ?? 'https://omerdogan.de/api', '/');
        $version = trim($version ?: (string) config('omr.version', 'v1'), '/');

        if ($version !== '' && !str_starts_with(strtolower($version), 'v')) {
            $version = 'v' . $version;
        }

        $url = "{$base}/{$version}/settings/{$section}";

        try {
            $response = Http::withoutVerifying()
                ->timeout(config('omr.timeout', 30))
                ->connectTimeout(10)
                ->withHeaders([
                    'Accept' => 'application/json',
                    'X-Tenant-ID' => $tenant,
                ])
                ->get($url, [
                    'tenant' => $tenant,
                    'locale' => $locale ?: config('omr.default_locale', 'de'),
                ]);

            if (!$response->successful()) {
                return [];
            }

            $data = $response->json('data') ?? [];

            return is_array($data) ? $data : [];
        } catch (\Throwable $e) {
            Log::debug('Versioned setting section fetch failed', [
                'section' => $section,
                'version' => $version,
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }

    private static function resolveMediaValue(mixed $value, string $tenant): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_string($value) && preg_match('/^https?:\/\//', $value)) {
            return $value;
        }

        if (!is_numeric($value)) {
            return is_string($value) ? self::replaceImageTenant($value) : null;
        }

        $cacheKey = 'settings_media:' . config('omr.version', 'v1') . ':' . $tenant . ':' . $value;

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($value, $tenant) {
            $base = rtrim(config('omr.base_url') ?? env('OMR_API_BASE') ?? 'https://omerdogan.de/api', '/');
            $endpoint = rtrim(config('omr.endpoint'), '/');

            try {
                $response = Http::withoutVerifying()
                    ->timeout(config('omr.timeout', 30))
                    ->connectTimeout(10)
                    ->withHeaders([
                        'Accept' => 'application/json',
                        'X-Tenant-ID' => $tenant,
                    ])
                    ->get("{$base}{$endpoint}/media/{$value}");

                if (!$response->successful()) {
                    return null;
                }

                $media = $response->json('data') ?? [];
                $url = is_array($media) ? ($media['url'] ?? null) : null;

                return is_string($url) ? self::replaceImageTenant($url) : null;
            } catch (\Throwable $e) {
                Log::debug('Settings media resolve failed', [
                    'media_id' => $value,
                    'error' => $e->getMessage(),
                ]);

                return null;
            }
        });
    }

    private static function emptySettingsPayload(): array
    {
        return [
            'general' => [],
            'seo' => [],
            'branding' => [],
            'colors' => [],
            'contact' => [],
            'social' => [],
            'analytics' => [],
            'performance' => [],
            'email' => [],
            'custom-code' => [],
            'footer' => [],
        ];
    }

    public function index(Request $request): array
    {
        $locale = $request->query('locale') ?? $request->route('locale') ?? config('omr.default_locale', 'de');
        $tenantId = config('omr.tenant_id') ?: config('omr.main_tenant') ?: '';
        if (!$tenantId) {
            return [];
        }
        return self::getSettings($tenantId, $locale);
    }

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

    public function clearCache(): array
    {
        $tenantId = config('omr.tenant_id') ?: config('omr.main_tenant') ?: '';
        $mainTenant = config('omr.main_tenant') ?: env('OMR_MAIN_TENANT') ?: $tenantId;

        self::$requestCache = [];

        foreach (['de', 'en', 'tr'] as $locale) {
            if ($tenantId) {
                Cache::forget("settings_" . config('omr.version', 'v1') . "_{$tenantId}_{$locale}_{$mainTenant}");
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
