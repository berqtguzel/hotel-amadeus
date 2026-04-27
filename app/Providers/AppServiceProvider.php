<?php

namespace App\Providers;

use App\Services\SettingsService;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Route;

class AppServiceProvider extends ServiceProvider
{
    private static function colorsToCssVars(array $colors): string
    {
        $map = [
            'site_primary_color' => '--site-primary-color',
            'site_secondary_color' => '--site-secondary-color',
            'site_accent_color' => '--site-accent-color',
            'button_color' => '--site-button-color',
            'text_color' => '--site-text-color',
            'h1_color' => '--site-h1-color',
            'h2_color' => '--site-h2-color',
            'h3_color' => '--site-h3-color',
            'link_color' => '--site-link-color',
            'background_color' => '--site-background-color',
            'header_background_color' => '--site-header-background-color',
            'footer_background_color' => '--site-footer-background-color',
        ];

        $lines = [];
        foreach ($map as $key => $cssVar) {
            $camelKey = lcfirst(str_replace('_', '', ucwords($key, '_')));
            $val = $colors[$key] ?? $colors[$camelKey] ?? null;
            if ($val && is_string($val)) {
                $lines[] = sprintf('%s: %s !important;', $cssVar, e($val));
            }
        }

        $headerBg = $colors['header_background_color'] ?? $colors['headerBackgroundColor'] ?? '';
        if ($headerBg && preg_match('/^#[0-9A-Fa-f]{6}$/', $headerBg)) {
            $r = hexdec(substr($headerBg, 1, 2));
            $g = hexdec(substr($headerBg, 3, 2));
            $b = hexdec(substr($headerBg, 5, 2));
            $luminance = (0.299 * $r + 0.587 * $g + 0.114 * $b) / 255;
            $lines[] = sprintf('--site-header-text-color: %s !important;', $luminance > 0.6 ? '#1a1a1a' : '#ffffff');
        }

        return implode("\n  ", $lines);
    }

    public function register() {}

    public function boot(): void
    {
        // 🔒 HTTPS zorla
        if (filter_var(env('FORCE_HTTPS', false), FILTER_VALIDATE_BOOL)) {
            URL::forceScheme('https');
        }

        // 🌍 API'den diller
        $availableLocales = collect(app(SettingsService::class)->get('languages') ?? [])
            ->pluck('locale')
            ->filter()
            ->map(fn($l) => strtolower($l))
            ->unique()
            ->values()
            ->toArray();

        // fallback
        if (empty($availableLocales)) {
            $availableLocales = ['de', 'en', 'tr'];
        }

        // 🔥 GLOBAL ROUTE PATTERN
        Route::pattern('locale', implode('|', $availableLocales));

        // 🔥 URL normalize (ÇOK ÖNEMLİ)
        $segments = request()->segments();

        if (count($segments) >= 2) {
            $first = strtolower($segments[0]);
            $second = strtolower($segments[1]);

            if (in_array($first, $availableLocales) && in_array($second, $availableLocales)) {
                array_shift($segments);
                redirect('/' . implode('/', $segments))->send();
                exit;
            }
        }

        // 🔥 aktif locale
        $locale = request()->route('locale')
            ?? (in_array(request()->segment(1), $availableLocales, true) ? request()->segment(1) : null)
            ?? config('omr.default_locale', 'de');

        // 🌍 global paylaş (frontend için önemli)
        View::share('locale', $locale);
        View::share('availableLocales', $availableLocales);

        // 🎨 renk sistemi
        $tenantId = config('omr.tenant_id') ?: config('omr.main_tenant') ?: '';
        $siteColorsCss = '';

        if ($tenantId) {
            $colors = app(SettingsService::class)->get('colors', $locale);
            $siteColorsCss = self::colorsToCssVars(is_array($colors) ? $colors : []);
        }

        View::share('siteColorsCss', $siteColorsCss);
    }
}
