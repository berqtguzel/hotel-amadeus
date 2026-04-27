<?php

$configuredVersion = env('OMR_API_VERSION', env('VITE_OMR_API_VERSION'));
$apiVersion = trim((string) ($configuredVersion ?? 'v1'), " \t\n\r\0\x0B/");

if ($apiVersion !== '' && ! str_starts_with(strtolower($apiVersion), 'v')) {
    $apiVersion = 'v' . $apiVersion;
}

$endpoint = env('OMR_API_ENDPOINT');

if (! $endpoint && $configuredVersion === null) {
    $endpoint = env('OMR_MENU_ENDPOINT');
}

if (! $endpoint) {
    $endpoint = '/' . ($apiVersion ?: 'v1') . '/';
}

$endpoint = '/' . trim((string) $endpoint, '/') . '/';

return [

    'base_url' => env('OMR_API_BASE'),

    'video_base_url' => env('OMR_API_VIDEO_BASE'),

    'version' => $apiVersion ?: trim($endpoint, '/'),

    'timeout' => env('OMR_API_TIMEOUT', 10),

    'tenant_id' => env('OMR_TENANT_ID'),

    'endpoint' => $endpoint,

    'endpoint_path' => rtrim($endpoint, '/'),

    'default_locale' => env('OMR_DEFAULT_LOCALE', 'de'),

    'main_tenant' => env('OMR_MAIN_TENANT'),

    'hero_slider_slug' => env('OMR_HERO_SLIDER_SLUG', 'hero'),

];
