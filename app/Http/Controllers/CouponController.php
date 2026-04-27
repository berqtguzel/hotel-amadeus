<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class CouponController extends Controller
{
    public static function fetchCoupons(): array
    {
        $mainTenant = config('omr.main_tenant') ?: config('omr.tenant_id');
        $version = config('omr.version', 'v1');
        $cacheKey = 'coupons:' . ($mainTenant ?: 'default') . ':' . $version;

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($mainTenant) {
            try {
                $base = rtrim(config('omr.base_url') ?? 'https://omerdogan.de/api', '/');
                $endpoint = rtrim(config('omr.endpoint'), '/');
                $tenantParam = $mainTenant ? '?tenant=' . $mainTenant : '';

                $response = Http::timeout(5)
                    ->get("{$base}{$endpoint}/coupons" . $tenantParam);

                if ($response->successful()) {
                    $json = $response->json();
                    return $json['data']['coupons'] ?? [];
                }

            } catch (\Exception $e) {

            }

            return [];
        });
    }

    public static function fetchCouponById(int $id): array
    {
        $mainTenant = config('omr.main_tenant') ?: config('omr.tenant_id');
        $version = config('omr.version', 'v1');
        $cacheKey = 'coupon:' . ($mainTenant ?: 'default') . ':' . $version . ':' . $id;

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($mainTenant, $id) {
            try {
                $base = rtrim(config('omr.base_url') ?? 'https://omerdogan.de/api', '/');
                $endpoint = rtrim(config('omr.endpoint'), '/');
                $tenantParam = $mainTenant ? '?tenant=' . $mainTenant : '';

                $response = Http::timeout(5)
                    ->get("{$base}{$endpoint}/coupons/{$id}" . $tenantParam);

                if ($response->successful()) {
                    $json = $response->json();
                    return $json['data'] ?? [];
                }

            } catch (\Exception $e) {

            }

            return [];
        });
    }
}
