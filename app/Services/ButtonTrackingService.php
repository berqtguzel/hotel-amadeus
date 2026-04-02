<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ButtonTrackingService
{
    public function track(array $payload): bool
    {
        $base = rtrim(config('omr.base_url'), '/');
        $endpoint = trim(config('omr.endpoint', ''), '/');
        $tenant = config('omr.tenant_id');
        $timeout = config('omr.timeout', 10);

        if (!$tenant || !$base) {
            Log::error('Tracking config missing', [
                'base' => $base,
                'tenant' => $tenant,
                'endpoint' => $endpoint,
            ]);
            return false;
        }

        // ✅ DOĞRU URL BUILD
        $url = "{$base}/{$endpoint}/button-tracking/track";

        $data = array_merge([
            'timestamp' => now()->toIso8601String(),
            'url' => request()?->fullUrl(),
        ], $payload);

        try {
            $response = Http::timeout($timeout)
                ->acceptJson()
                ->withHeaders([
                    'X-Tenant-ID' => $tenant,
                ])
                ->post($url, $data);

            // 🔥 DEBUG LOG
            Log::info('TRACKING RESPONSE', [
                'url' => $url,
                'status' => $response->status(),
                'success' => $response->successful(),
                'payload' => $data,
                'response' => $response->body(),
            ]);


            return $response->successful();
        } catch (\Throwable $e) {
            Log::error('TRACKING ERROR', [
                'url' => $url,
                'error' => $e->getMessage(),
                'payload' => $data,
            ]);

            return false;
        }
    }
}
