<?php

namespace App\Http\Controllers;

use App\Services\ApiHealthService;
use App\Services\RatingWidgetsService;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class RatingWidgetsController extends Controller
{
    public function __construct(
        private RatingWidgetsService $ratingWidgetsService,
        private ApiHealthService $apiHealth,
    ) {}

    public function index(string $locale)
    {
        $locale = strtolower($locale);
        $tenant = config('omr.main_tenant') ?: config('omr.tenant_id') ?: 'default';
        $cacheKey = "rating_widgets:{$tenant}:{$locale}";

        $ratingData = Cache::remember($cacheKey, now()->addDays(7), function () use ($locale) {
            if ($this->apiHealth->isAvailable()) {
                return $this->ratingWidgetsService->getRatings($locale);
            }

            return $this->getFallbackRatings($locale);
        });

        return Inertia::render('Dynamic/RatingWidgets', [
            'ratings' => $ratingData['ratings'] ?? [],
            'meta' => $ratingData['meta'] ?? [
                'current_language' => $locale,
                'default_language' => $locale,
                'available_languages' => [$locale],
            ],
            'locale' => $locale,
        ]);
    }

    private function getFallbackRatings(string $locale): array
    {
        return [
            'ratings' => [],
            'meta' => [
                'current_language' => $locale,
                'default_language' => $locale,
                'available_languages' => ['de', 'en', 'tr'],
            ],
        ];
    }
}
