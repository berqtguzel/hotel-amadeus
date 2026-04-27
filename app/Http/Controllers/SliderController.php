<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SliderController extends Controller
{
    private const CACHE_VERSION = 2;

    public function getSliders(string $locale, string $slug)
    {
        $base       = rtrim(config('omr.video_base_url') ?: config('omr.base_url'), '/');
        $apiBase    = rtrim(config('omr.base_url'), '/');
        $endpoint   = rtrim(config('omr.endpoint'), '/');
        $tenant     = config('omr.tenant_id');
        $mainTenant = config('omr.main_tenant') ?: $tenant;

        $locale = strtolower($locale);
        $slug   = strtolower($slug);

        if (!$tenant) {
            abort(500, 'OMR_TENANT_ID missing');
        }

        if (!$base) {
            abort(500, 'OMR base URL missing');
        }

        $cacheKey = "slider_show:v" . self::CACHE_VERSION . ":{$mainTenant}:{$locale}:{$slug}";

        $sliderData = Cache::remember($cacheKey, now()->addDays(7), function () use (
            $base,
            $apiBase,
            $endpoint,
            $mainTenant,
            $locale,
            $slug,
            $tenant
        ) {
            try {
                $response = Http::timeout(10)
                    ->withHeaders([
                        'X-Tenant-ID' => $mainTenant,
                    ])
                    ->get("{$apiBase}{$endpoint}/sliders/{$slug}", [
                        'tenant' => $mainTenant,
                        'locale' => $locale,
                    ]);

                if (!$response->successful()) {
                    Log::warning('Slider API failed', [
                        'slug'   => $slug,
                        'status' => $response->status(),
                        'tenant' => $tenant,
                        'locale' => $locale,
                        'url'    => "{$apiBase}{$endpoint}/sliders/{$slug}",
                        'body'   => $response->body(),
                    ]);

                    return null;
                }

                $data = $response->json('data');

                if (!is_array($data)) {
                    Log::warning('Slider API returned invalid data format', [
                        'slug'   => $slug,
                        'tenant' => $tenant,
                        'locale' => $locale,
                        'data'   => $data,
                    ]);

                    return null;
                }

                return self::fixStorageUrls($data);
            } catch (\Throwable $e) {
                Log::error('Error fetching slider data', [
                    'slug'   => $slug,
                    'error'  => $e->getMessage(),
                    'tenant' => $tenant,
                    'locale' => $locale,
                ]);

                return null;
            }
        });

        if (!$sliderData) {
            abort(404, 'Slider not found');
        }

        return response()->json(['data' => $sliderData]);
    }


    private static function fixStorageUrls(mixed $data): mixed
    {
        if (is_array($data)) {
            return array_map([self::class, 'fixStorageUrls'], $data);
        }

        if (is_string($data)) {
            return str_replace('/api/storage/', '/storage/', $data);
        }

        return $data;
    }
}
