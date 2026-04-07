<?php

namespace App\Http\Controllers;

use App\Services\ReviewsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewsController extends Controller
{
    public function index(string $locale, ReviewsService $service): JsonResponse
    {
        return response()->json([
            'data' => $service->getReviews($locale)
        ]);
    }

    // Eksik olan criteria metodunu ekledik
    public function criteria(Request $request, ReviewsService $service): JsonResponse
    {
        // İstekte dil parametresi yoksa varsayılanı kullan (örn: de)
        $locale = $request->get('lang', app()->getLocale() ?? 'de');

        return response()->json([
            'success' => true,
            'data' => [
                'criteria' => $service->getCriteria($locale)
            ]
        ]);
    }

    public function store(Request $request, ReviewsService $service): JsonResponse
    {
        $validated = $request->validate([
            'author_name'        => ['required', 'string', 'max:255'],
            'author_email'       => ['required', 'email'],
            'content'            => ['required', 'string'],
            'rating'             => ['nullable', 'integer', 'min:1', 'max:5'],
            'criteria_ratings'   => ['nullable', 'array'],
            'criteria_ratings.*' => ['integer', 'min:1', 'max:10'], // API 1-10 arası bekliyor
        ]);

        $result = $service->createReview($validated);

        if (isset($result['error'])) {
            return response()->json([
                'message' => 'Hata oluştu: ' . $result['error'],
                'debug'   => $result['details'] ?? null
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Review submitted successfully. It will be published after approval.',
            'data'    => $result['data'] ?? $result
        ]);
    }
}
