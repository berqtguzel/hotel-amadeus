<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Http;
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

    public function register()
    {
        //
    }

    public function boot(): void

    {

        if (filter_var(env('FORCE_HTTPS', false), FILTER_VALIDATE_BOOL)) {
            URL::forceScheme('https');
        }


        $locale = request()->route('locale')
            ?? (in_array(request()->segment(1), ['de', 'en', 'tr'], true) ? request()->segment(1) : null)
            ?? config('omr.default_locale', 'de');
        $tenantId = config('omr.tenant_id') ?: config('omr.main_tenant') ?: '';
        $siteColorsCss = '';
        if ($tenantId) {
            $settings = \App\Http\Controllers\SettingsController::getSettings($tenantId, $locale);
            $colors = $settings['colors'] ?? [];
            $siteColorsCss = self::colorsToCssVars(is_array($colors) ? $colors : []);
        }
        View::share('siteColorsCss', $siteColorsCss);
    }
}
