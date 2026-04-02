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

    public function criteria(ReviewsService $service): JsonResponse
    {
        return response()->json([
            'data' => $service->getCriteriaList()
        ]);
    }

    public function store(Request $request, ReviewsService $service): JsonResponse
    {
        $validated = $request->validate([
            'author_name'  => ['required', 'string', 'max:255'],
            'author_email' => ['required', 'email'],
            'content'      => ['required', 'string'],
            'ratings'      => ['required', 'array'],
        ]);

        $ratingsInput = $validated['ratings'];

        // 🔥 MANUAL VALIDATION
        foreach ($ratingsInput as $key => $value) {
            if (!is_numeric($value) || $value < 1 || $value > 10) {
                return response()->json([
                    'message' => "Invalid rating for {$key}"
                ], 422);
            }
        }

        $criteriaMap = $service->getCriteriaMap();
        $ratings = [];

        foreach ($ratingsInput as $key => $value) {
            $id = null;

            if (isset($criteriaMap[$key])) {
                $id = $criteriaMap[$key];
            } else {
                foreach ($criteriaMap as $name => $cid) {
                    if (strtolower($name) === strtolower($key)) {
                        $id = $cid;
                        break;
                    }
                }
            }

            if ($id) {
                $ratings[] = [
                    'criteria_id' => $id,
                    'rating' => (int)$value
                ];
            }
        }

        if (empty($ratings)) {
            return response()->json([
                'message' => 'No valid criteria found',
                'debug' => $criteriaMap
            ], 422);
        }

        $overall = round(collect($ratings)->avg('rating'));

        $result = $service->createReview([
            'author_name'  => $validated['author_name'],
            'author_email' => $validated['author_email'],
            'content'      => $validated['content'],
            'rating'       => $overall,
            'ratings'      => $ratings,
        ]);

        if (isset($result['error'])) {
            return response()->json([
                'message' => 'API Error',
                'debug'   => $result
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Review submitted successfully',
            'data' => $result
        ]);
    }
}
