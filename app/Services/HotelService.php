<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HotelService
{
    public function getHotels(): array
    {

        $base = rtrim(config('omr.base_url'), '/');
        $endpoint = rtrim(config('omr.endpoint'), '/');
        $tenant = config('omr.main_tenant') ?: config('omr.tenant_id');

        if (!$tenant) {
            Log::error('HotelService: OMR_TENANT_ID eksik!');
            return [];
        }

        $cacheKey = "hotels_list:{$tenant}";

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($base, $endpoint, $tenant) {
            try {
                $url = "{$base}{$endpoint}/hotels";

                $response = Http::timeout(10)
                    ->withHeaders(['X-Tenant-ID' => $tenant])
                    ->get($url);

                if (!$response->successful()) {
                    Log::warning('Hotel API Hatası', ['status' => $response->status()]);
                    return [];
                }

                $json = $response->json();

                return $json['data'] ?? [];

            } catch (\Throwable $e) {
                Log::error('Hotels çekilirken hata: ' . $e->getMessage());
                return [];
            }
        });
    }
}
