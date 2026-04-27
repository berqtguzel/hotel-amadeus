<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MenuService
{
    public function getMenu(string $locale): array
    {
        $base   = rtrim(config('omr.base_url'), '/');
        $endpoint = rtrim(config('omr.endpoint'), '/');
        $tenant = config('omr.main_tenant') ?: config('omr.tenant_id');

        if (!$tenant) {
            Log::error('OMR_TENANT_ID missing');
            return [];
        }

        $locale = strtolower($locale);
        $cacheKey = "menu:" . config('omr.version', 'v1') . ":{$tenant}:{$locale}";

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($base, $endpoint, $tenant, $locale) {
            try {
                $url = "{$base}{$endpoint}/menus";

                $response = Http::timeout(10)
                    ->withHeaders(['X-Tenant-ID' => $tenant])
                    ->get($url, [
                        'lang' => $locale,
                    ]);

                if (!$response->successful()) {
                    Log::warning('Menu API failed', [
                        'status' => $response->status(),
                        'url' => $url,
                    ]);
                    return [];
                }

                $json = $response->json();
                $data = $json['data'] ?? $json;
                return is_array($data) ? $data : [];

            } catch (\Throwable $e) {
                Log::error('Error fetching menu', [
                    'error' => $e->getMessage(),
                ]);
                return [];
            }
        });
    }
}
