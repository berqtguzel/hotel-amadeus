<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ApiHealthService
{
    private const CACHE_KEY = 'omr_api_health';
    private const CACHE_TTL_OK = 300;       // 5 dk — API sağlıklıyken
    private const CACHE_TTL_FAIL = 30;      // 30 sn — API düştüğünde daha sık dene

    public function check(): array
    {
        return Cache::remember($this->cacheKey(), self::CACHE_TTL_OK, function () {
            return $this->ping();
        });
    }

    public function isAvailable(): bool
    {
        return $this->check()['success'] ?? false;
    }

    public function forceCheck(): array
    {
        Cache::forget($this->cacheKey());
        $result = $this->ping();

        $ttl = $result['success'] ? self::CACHE_TTL_OK : self::CACHE_TTL_FAIL;
        Cache::put($this->cacheKey(), $result, $ttl);

        return $result;
    }

    private function ping(): array
    {
        $base = rtrim(config('omr.base_url'), '/');
        $endpoint = rtrim(config('omr.endpoint'), '/');
        $tenant = config('omr.main_tenant') ?: config('omr.tenant_id');

        if (!$tenant || !$base) {
            return [
                'success' => false,
                'error' => 'API config missing',
                'checked_at' => now()->toIso8601String(),
            ];
        }

        try {
            $response = Http::timeout(5)
                ->withHeaders(['X-Tenant-ID' => $tenant])
                ->get("{$base}{$endpoint}/health");

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => $data['success'] ?? true,
                    'tenant_id' => $data['tenant_id'] ?? $tenant,
                    'db' => $data['db'] ?? null,
                    'api_time' => $data['timestamp'] ?? null,
                    'checked_at' => now()->toIso8601String(),
                ];
            }

            return [
                'success' => false,
                'error' => "HTTP {$response->status()}",
                'checked_at' => now()->toIso8601String(),
            ];
        } catch (\Throwable $e) {
            Log::warning('API health check failed', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'checked_at' => now()->toIso8601String(),
            ];
        }
    }

    private function cacheKey(): string
    {
        $tenant = config('omr.main_tenant') ?: config('omr.tenant_id') ?: 'default';
        $version = config('omr.version', 'v1');

        return self::CACHE_KEY . ':' . $version . ':' . $tenant;
    }
}
