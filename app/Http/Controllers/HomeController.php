<?php

namespace App\Http\Controllers;

use App\Services\ApiHealthService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function __construct(
        private ApiHealthService $apiHealth,
    ) {}

    public function index(string $locale = 'de')
    {
        $rooms = $this->apiHealth->isAvailable()
            ? $this->fetchRooms($locale)
            : [];

        return Inertia::render('Home/Index', [
            'currentRoute' => 'home',
            'locale' => $locale,
            'rooms' => $rooms,
        ]);
    }

    private function fetchRooms(string $locale): array
    {
        $tenant = config('omr.main_tenant') ?: config('omr.tenant_id') ?: 'default';
        $cacheKey = 'home_rooms:' . $tenant . ':' . strtolower($locale);

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($locale) {
            try {
                $url = config('omr.base_url') . config('omr.endpoint') . 'rooms';

                $response = Http::timeout(config('omr.timeout'))
                    ->withHeaders([
                        'X-Tenant-ID' => config('omr.tenant_id')
                    ])
                    ->get($url, [
                        'lang' => $locale,
                    ]);

                if ($response->successful()) {
                    $json = $response->json();
                    $data = $json['data'] ?? [];

                    return $this->normalizeRooms($data, $locale);
                }
            } catch (\Throwable $e) {
                //
            }

            return [];
        });
    }

    private function normalizeRooms(array $rooms, string $locale): array
    {
        $list = $this->unwrapRoomsPayload($rooms);

        $normalized = array_map(function ($room) use ($locale) {
            if (!is_array($room)) {
                return null;
            }

            $name = (string) ($room['name'] ?? '');
            if ($name === '' && isset($room['translations']) && is_array($room['translations'])) {
                $target = strtolower($locale);
                foreach ($room['translations'] as $tr) {
                    if (!is_array($tr)) {
                        continue;
                    }
                    $code = strtolower((string) ($tr['language_code'] ?? $tr['locale'] ?? ''));
                    if ($code !== '' && $code === $target) {
                        $name = (string) ($tr['name'] ?? $name);
                        break;
                    }
                }
                if ($name === '' && isset($room['translations'][0]) && is_array($room['translations'][0])) {
                    $name = (string) ($room['translations'][0]['name'] ?? $name);
                }
            }

            $slug = (string) ($room['slug'] ?? '');
            if ($slug === '') {
                $slug = Str::slug($name);
            }
            if ($slug === '') {
                $slug = (string) ($room['id'] ?? '');
            }

            $features = collect($room['features'] ?? [])
                ->filter(fn ($item) => is_array($item) && (($item['status'] ?? 'active') === 'active'))
                ->map(fn ($item) => [
                    'id' => $item['id'] ?? null,
                    'name' => $item['name'] ?? null,
                    'icon' => $item['icon'] ?? null,
                ])
                ->values()
                ->all();

            $boardTypes = collect($room['board_types'] ?? [])
                ->filter(fn ($item) => is_array($item) && (($item['is_active'] ?? true) === true))
                ->map(fn ($item) => [
                    'id' => $item['id'] ?? null,
                    'name' => $item['name'] ?? null,
                    'code' => $item['code'] ?? null,
                    'description' => $item['description'] ?? null,
                    'price' => $item['price'] ?? null,
                ])
                ->values()
                ->all();

            $items = array_values(array_filter(array_merge(
                array_map(fn ($item) => $item['name'] ?? null, $features),
                array_map(fn ($item) => $item['description'] ?? $item['name'] ?? null, $boardTypes),
            )));

            return [
                'id' => $room['id'] ?? null,
                'slug' => $slug,
                'name' => $name,
                'description' => $room['description'] ?? '',
                'capacity' => isset($room['capacity']) ? (int) $room['capacity'] : null,
                'status' => $room['status'] ?? 'active',
                'image' => $room['image'] ?? $room['hero_image'] ?? '/images/template2.png',
                'price' => $room['price'] ?? null,
                'order' => isset($room['order']) ? (int) $room['order'] : 9999,
                'features' => $features,
                'boardTypes' => $boardTypes,
                'items' => $items,
            ];
        }, $list);

        $normalized = array_values(array_filter($normalized, function ($room) {
            return is_array($room) && (($room['status'] ?? 'active') === 'active');
        }));

        usort($normalized, fn ($a, $b) => ($a['order'] ?? 9999) <=> ($b['order'] ?? 9999));

        return $normalized;
    }

    private function unwrapRoomsPayload(array $payload): array
    {
        if (array_is_list($payload)) {
            return $payload;
        }

        if (isset($payload['data']) && is_array($payload['data']) && array_is_list($payload['data'])) {
            return $payload['data'];
        }

        return [];
    }
}
