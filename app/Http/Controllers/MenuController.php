<?php
namespace App\Http\Controllers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class MenuController extends Controller
{
    public static function fetchMenuData(): array
    {
        $mainTenant = config('omr.main_tenant') ?: config('omr.tenant_id');
        $version = config('omr.version', 'v1');
        $cacheKey = 'menu_data:' . ($mainTenant ?: 'default') . ':' . $version;

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($mainTenant) {
            try {
                $base = rtrim(config('omr.base_url') ?? 'https://omerdogan.de/api', '/');
                $endpoint = rtrim(config('omr.endpoint'), '/');
                $tenantParam = $mainTenant ? '?tenant=' . $mainTenant : '';
                $response = Http::timeout(5)->get("{$base}{$endpoint}/menus" . $tenantParam);

                if ($response->successful()) {
                    return $response->json();
                }
            } catch (\Exception $e) {

            }

            return [];
        });
    }
}
