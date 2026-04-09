<?php

namespace App\Http\Controllers;

use App\Services\ApiHealthService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Inertia\Inertia;

class RoomPageController extends Controller
{
    public function __construct(
        private ApiHealthService $apiHealth,
    ) {}

    public function show(string $locale, string $room)
    {
        $roomData = null;
        $error = false;

        if ($this->apiHealth->isAvailable()) {
            $tenant = config('omr.main_tenant') ?: config('omr.tenant_id') ?: 'default';
            $cacheKey = 'room_show:v3:' . $tenant . ':' . strtolower($locale) . ':' . strtolower($room);

            $cached = Cache::remember($cacheKey, now()->addDays(7), function () use ($locale, $room) {
                try {
                    $roomData = $this->fetchRoom($locale, $room);

                    if ($roomData !== null) {
                        $roomId = $roomData['id'] ?? null;
                        $roomSlug = $roomData['slug'] ?? $room;

                        if ($roomId) {
                            $roomData['room_prices'] = $this->fetchRoomPrices(
                                (int) $roomId,
                                $locale,
                            );
                            $roomData['board_prices'] = $this->fetchBoardPrices(
                                (int) $roomId,
                                (string) $roomSlug,
                                $locale,
                            );
                        }

                        return [
                            'room' => $roomData,
                            'error' => false,
                        ];
                    }
                } catch (\Throwable $e) {
                    return [
                        'room' => null,
                        'error' => true,
                    ];
                }

                return [
                    'room' => null,
                    'error' => false,
                ];
            });

            $roomData = $cached['room'] ?? null;
            $error = (bool) ($cached['error'] ?? false);
        }

        if (!$roomData && !$error) {
            throw new NotFoundHttpException();
        }

        return Inertia::render('Rooms/Show', [
            'locale' => $locale,
            'roomSlug' => $room,
            'room' => $roomData,
            'error' => $error,
        ]);
    }

    private function fetchRoom(string $locale, string $room): ?array
    {
        $identifier = trim((string) $room);
        if ($identifier === '') {
            return null;
        }

        $url = config('omr.base_url') . config('omr.endpoint') . 'rooms/' . $identifier;
        $response = $this->apiRequest($url, $this->langQuery(strtolower($locale)));

        if ($response && $response->successful()) {
            $json = $response->json();
            $data = $json['data'] ?? null;
            if (is_array($data)) {
                return $data;
            }
        }

        // Fallback: bazı API kurulumlarında /rooms/{slug} desteklenmez.
        // Bu durumda listeyi çekip id/slug/name üzerinden eşleştiriyoruz.
        $listUrl = config('omr.base_url') . config('omr.endpoint') . 'rooms';
        foreach ($this->localeFallbackChain($locale) as $lang) {
            $items = $this->fetchPaginatedItems($listUrl, $this->langQuery($lang));
            $matched = $this->findRoomByIdentifier($items, $identifier);
            if ($matched) {
                return $matched;
            }
        }

        $items = $this->fetchPaginatedItems($listUrl);
        return $this->findRoomByIdentifier($items, $identifier);
    }

    private function findRoomByIdentifier(array $items, string $identifier): ?array
    {
        $needle = Str::lower(trim($identifier));
        if ($needle === '') {
            return null;
        }

        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }

            $id = Str::lower((string) ($item['id'] ?? ''));
            $slug = Str::lower((string) ($item['slug'] ?? ''));
            $name = Str::lower((string) ($item['name'] ?? ''));
            $nameSlug = Str::slug((string) ($item['name'] ?? ''));

            if ($needle === $id || $needle === $slug || $needle === $name || $needle === $nameSlug) {
                return $item;
            }

            $translations = $item['translations'] ?? [];
            if (! is_array($translations)) {
                continue;
            }

            foreach ($translations as $translation) {
                if (! is_array($translation)) {
                    continue;
                }

                $translatedName = Str::lower((string) ($translation['name'] ?? ''));
                $translatedSlug = Str::slug((string) ($translation['name'] ?? ''));
                if ($needle === $translatedName || $needle === $translatedSlug) {
                    return $item;
                }
            }
        }

        return null;
    }

    /**
     * Bazı API kurulumlarında günlük fiyatlar yalnızca belirli bir lang ile dolu döner.
     * Önce istenen dili dene; boşsa varsayılan ve diğer desteklenen dilleri sırayla dene.
     *
     * @return list<string>
     */
    private function localeFallbackChain(string $locale): array
    {
        $locale = strtolower($locale);
        $chain = [];

        foreach (array_merge(
            [$locale],
            [config('omr.default_locale', 'de')],
            ['de', 'en', 'tr'],
        ) as $code) {
            $code = strtolower((string) $code);
            if ($code !== '' && ! in_array($code, $chain, true)) {
                $chain[] = $code;
            }
        }

        return $chain;
    }

    /**
     * @return array<string, string>
     */
    private function langQuery(string $lang): array
    {
        return [
            'lang' => $lang,
            'locale' => $lang,
        ];
    }

    private function fetchRoomPrices(int $roomId, string $locale): array
    {
        $url = config('omr.base_url') . config('omr.endpoint') . 'room-prices';

        foreach ($this->localeFallbackChain($locale) as $lang) {
            $items = $this->fetchPaginatedItems($url, array_merge(
                $this->langQuery($lang),
                ['room_id' => $roomId],
            ));
            $mapped = $this->mapRoomPriceRows($items);
            if ($mapped !== []) {
                return $mapped;
            }
        }

        $items = $this->fetchPaginatedItems($url, ['room_id' => $roomId]);
        $mapped = $this->mapRoomPriceRows($items);

        return $mapped;
    }

    /**
     * @param  array<int, mixed>  $items
     * @return array<int, array<string, mixed>>
     */
    private function mapRoomPriceRows(array $items): array
    {
        return array_values(array_filter(array_map(function ($item) {
            if (! is_array($item)) {
                return null;
            }

            if (isset($item['attributes']) && is_array($item['attributes'])) {
                $item = array_merge($item, $item['attributes']);
            }

            $date = $this->normalizeRoomPriceDate(
                $item['date'] ?? $item['day'] ?? null,
            );

            if ($date === null) {
                return null;
            }

            return [
                'id' => $item['id'] ?? null,
                'date' => $date,
                'price' => isset($item['price']) ? (float) $item['price'] : null,
                'capacity' => isset($item['capacity']) ? (int) $item['capacity'] : null,
                'closed' => (bool) ($item['closed'] ?? false),
                'notes' => $item['notes'] ?? null,
                'discount_rate' => isset($item['discount_rate']) ? (float) $item['discount_rate'] : null,
                'child_discount_0_6' => isset($item['child_discount_0_6']) ? (float) $item['child_discount_0_6'] : null,
                'child_discount_7_12' => isset($item['child_discount_7_12']) ? (float) $item['child_discount_7_12'] : null,
                'child_discount_13_18' => isset($item['child_discount_13_18']) ? (float) $item['child_discount_13_18'] : null,
            ];
        }, $items)));
    }

    private function normalizeRoomPriceDate(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_string($value)) {
            $value = trim($value);
            if ($value === '') {
                return null;
            }
            if (preg_match('/^(\d{4}-\d{2}-\d{2})/', $value, $m)) {
                return $m[1];
            }
        }

        return null;
    }

    private function fetchBoardPrices(int $roomId, string $roomSlug, string $locale): array
    {
        $url = config('omr.base_url') . config('omr.endpoint') . 'board-prices';

        foreach ($this->localeFallbackChain($locale) as $lang) {
            $items = $this->fetchPaginatedItems($url, $this->langQuery($lang));
            $filtered = array_filter($items, function ($item) use ($roomId, $roomSlug) {
                if (! is_array($item)) {
                    return false;
                }

                return (int) ($item['room_id'] ?? 0) === $roomId
                    || (string) ($item['room_slug'] ?? '') === $roomSlug;
            });

            $mapped = $this->mapBoardPriceRows($filtered);
            if ($mapped !== []) {
                return $mapped;
            }
        }

        $items = $this->fetchPaginatedItems($url, []);
        $filtered = array_filter($items, function ($item) use ($roomId, $roomSlug) {
            if (! is_array($item)) {
                return false;
            }

            return (int) ($item['room_id'] ?? 0) === $roomId
                || (string) ($item['room_slug'] ?? '') === $roomSlug;
        });

        return $this->mapBoardPriceRows($filtered);
    }

    /**
     * @param  array<int, mixed>  $filtered
     * @return array<int, array<string, mixed>>
     */
    private function mapBoardPriceRows(array $filtered): array
    {
        return array_values(array_filter(array_map(function ($item) {
            if (! is_array($item)) {
                return null;
            }

            if (isset($item['attributes']) && is_array($item['attributes'])) {
                $item = array_merge($item, $item['attributes']);
            }

            return [
                'id' => $item['id'] ?? null,
                'board_type_id' => $item['board_type_id'] ?? null,
                'name' => $item['board_type_name'] ?? $item['name'] ?? '',
                'code' => $item['board_type_code'] ?? $item['code'] ?? '',
                'price' => isset($item['price']) ? (float) $item['price'] : null,
            ];
        }, $filtered)));
    }

    private function fetchPaginatedItems(string $url, array $query = []): array
    {
        $firstPage = $this->apiRequest($url, array_merge($query, ['page' => 1]));

        if (!$firstPage || !$firstPage->successful()) {
            return [];
        }

        $json = $firstPage->json();
        $items = $this->extractItems($json);
        $lastPage = $this->extractLastPage($json);

        if ($lastPage <= 1) {
            return $items;
        }

        for ($page = 2; $page <= $lastPage; $page++) {
            $response = $this->apiRequest($url, array_merge($query, ['page' => $page]));

            if (!$response || !$response->successful()) {
                continue;
            }

            $items = array_merge($items, $this->extractItems($response->json()));
        }

        return $items;
    }

    private function extractItems(array $payload): array
    {
        $data = $payload['data'] ?? $payload;

        if (is_array($data) && isset($data['data']) && is_array($data['data'])) {
            $data = $data['data'];
        }

        if (is_array($data) && array_is_list($data)) {
            return array_values(array_filter($data, 'is_array'));
        }

        if (is_array($data)) {
            foreach (['items', 'room_prices', 'prices', 'results', 'records'] as $key) {
                if (isset($data[$key]) && is_array($data[$key]) && array_is_list($data[$key])) {
                    return array_values(array_filter($data[$key], 'is_array'));
                }
            }

            if (!array_is_list($data) && count($data) > 0) {
                return [$data];
            }
        }

        return [];
    }

    private function extractLastPage(array $payload): int
    {
        $data = $payload['data'] ?? $payload;
        $pagination = is_array($data) ? ($data['pagination'] ?? $payload['pagination'] ?? null) : null;

        if (is_array($pagination) && isset($pagination['last_page'])) {
            return max(1, (int) $pagination['last_page']);
        }

        return 1;
    }

    private function apiRequest(string $url, array $query = []): ?\Illuminate\Http\Client\Response
    {
        return Http::timeout(config('omr.timeout'))
            ->withHeaders([
                'X-Tenant-ID' => config('omr.tenant_id'),
            ])
            ->get($url, $query);
    }
}
