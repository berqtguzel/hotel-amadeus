<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class RoomController extends Controller
{
    public function index(Request $request, string $locale = 'de')
    {
        $filters = [
            'lang' => $locale ?? config('omr.locale'),
            'status' => $request->status,
            'min_capacity' => $request->min_capacity,
            'search' => $request->search,
            'per_page' => $request->per_page ?? 10,
        ];
        $tenant = config('omr.main_tenant') ?: config('omr.tenant_id') ?: 'default';
        $cacheKey = 'rooms_index:' . md5(json_encode([
            'version' => config('omr.version', 'v1'),
            'tenant' => $tenant,
            'locale' => $locale,
            'filters' => $filters,
        ]));

        $cached = Cache::remember($cacheKey, now()->addDays(7), function () use ($filters) {
            $url = config('omr.base_url') . config('omr.endpoint') . 'rooms';

            $response = Http::timeout(config('omr.timeout'))
                ->withHeaders([
                    'X-Tenant-ID' => config('omr.tenant_id')
                ])
                ->get($url, $filters);

            if ($response->successful()) {
                $json = $response->json();

                return [
                    'rooms' => $json['data'] ?? [],
                    'pagination' => $json['pagination'] ?? null,
                ];
            }

            return [
                'rooms' => [],
                'pagination' => null,
            ];
        });

        return Inertia::render('Rooms/Index', [
            'locale' => $locale,
            'rooms' => $cached['rooms'] ?? [],
            'pagination' => $cached['pagination'] ?? null,
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
                'min_capacity' => $request->min_capacity,
            ]
        ]);
    }
}
