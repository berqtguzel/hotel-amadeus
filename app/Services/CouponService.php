<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CouponService
{
    public function getCoupons(): array
    {
        $base   = rtrim(config('omr.base_url'), '/');
        $endpoint = rtrim(config('omr.endpoint'), '/');
        $tenant = config('omr.main_tenant') ?: config('omr.tenant_id');

        if (!$tenant) {
            Log::error('OMR_TENANT_ID missing');
            return [];
        }

        $cacheKey = "coupons:" . config('omr.version', 'v1') . ":{$tenant}";

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($base, $endpoint, $tenant) {
            try {
                $url = "{$base}{$endpoint}/coupons";

                $response = Http::timeout(10)
                    ->withHeaders(['X-Tenant-ID' => $tenant])
                    ->get($url);

                if (!$response->successful()) {
                    Log::warning('Coupons API failed', [
                        'status' => $response->status(),
                        'url' => $url,
                    ]);
                    return [];
                }

                $json = $response->json();
                $data = $json['data']['coupons'] ?? [];

                return is_array($data) ? $data : [];

            } catch (\Throwable $e) {
                Log::error('Error fetching coupons', [
                    'error' => $e->getMessage(),
                ]);
                return [];
            }
        });
    }

    public function getCouponById(int $id): array
    {
        $base   = rtrim(config('omr.base_url'), '/');
        $endpoint = rtrim(config('omr.endpoint'), '/');
        $tenant = config('omr.main_tenant') ?: config('omr.tenant_id');

        if (!$tenant) {
            Log::error('OMR_TENANT_ID missing');
            return [];
        }

        $cacheKey = "coupon:" . config('omr.version', 'v1') . ":{$tenant}:{$id}";

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($base, $endpoint, $tenant, $id) {
            try {
                $url = "{$base}{$endpoint}/coupons/{$id}";

                $response = Http::timeout(10)
                    ->withHeaders(['X-Tenant-ID' => $tenant])
                    ->get($url);

                if (!$response->successful()) {
                    Log::warning('Coupon detail API failed', [
                        'status' => $response->status(),
                        'url' => $url,
                        'id' => $id,
                    ]);
                    return [];
                }

                $json = $response->json();
                $data = $json['data'] ?? [];

                return is_array($data) ? $data : [];

            } catch (\Throwable $e) {
                Log::error('Error fetching coupon detail', [
                    'error' => $e->getMessage(),
                    'id' => $id,
                ]);
                return [];
            }
        });
    }
}
