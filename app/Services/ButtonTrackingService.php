<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ButtonTrackingService
{
    public function track(array $data): bool
    {
        try {
            Log::info('🚀 ORIGINAL DATA', $data);

            // ✅ SESSION ID (ZORUNLU)
            $sessionId = $data['session_id'] ?? Str::uuid()->toString();

            // ✅ PAYLOAD DÖNÜŞÜMÜ
            $payload = [
                'button_key' => $data['button_id']
                    ?? $data['button_key']
                    ?? 'unknown',

                'session_id' => $sessionId,

                'metadata' => [
                    'event' => $data['event'] ?? null,
                    'button_label' => $data['button_label'] ?? null,
                    'button_name' => $data['button_name'] ?? null,
                    'page' => $data['metadata']['page'] ?? null,
                    'url' => $data['url'] ?? null,
                    ...($data['metadata'] ?? []),
                ],
            ];

            Log::info('📦 FINAL PAYLOAD TO API', $payload);

            $response = Http::timeout(5)
                ->withHeaders([
                    'X-Tenant-ID' => config('services.tracking.tenant'),
                ])
                ->post(config('services.tracking.url'), $payload);

            Log::info('📥 TRACKING API RESPONSE', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            if ($response->failed()) {
                Log::error('❌ TRACKING FAILED', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return false;
            }

            return true;

        } catch (\Throwable $e) {
            Log::error('🔥 TRACKING EXCEPTION', [
                'message' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
