<?php

namespace App\Http\Controllers;

use App\Services\ButtonTrackingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;

class ButtonTrackingController extends Controller
{
    public function __construct(
        private ButtonTrackingService $tracking,
    ) {}

    public function track(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'event' => 'nullable|string|max:255',
            'button_id' => 'nullable|string|max:255',
            'button_label' => 'nullable|string|max:255',
            'button_name' => 'nullable|string|max:255',
            'page' => 'nullable|string',
            'url' => 'nullable|string',
            'metadata' => 'nullable|array',
        ]);

        $payload = array_filter($validated, fn ($v) => $v !== null && $v !== '');

        Log::info('TRACKING RECEIVED', $payload);

        $ok = $this->tracking->track($payload);

        return response()->json([
            'success' => $ok,
        ]);
    }

    public function trackAndRedirect(Request $request): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'redirect' => 'required|string',
            'button_id' => 'nullable|string|max:255',
            'button_label' => 'nullable|string|max:255',
        ]);

        $redirect = $validated['redirect'];

        if (str_starts_with($redirect, '/')) {
            $target = url($redirect);
        } elseif (filter_var($redirect, FILTER_VALIDATE_URL)) {
            $target = $redirect;
        } else {
            return response()->json(['error' => 'Invalid redirect'], 400);
        }

        $payload = [
            'event' => 'redirect_click',
            'button_id' => $validated['button_id'] ?? null,
            'button_label' => $validated['button_label'] ?? null,
            'page' => $request->header('referer') ?? $request->fullUrl(),
        ];

        $payload = array_filter($payload, fn ($v) => $v !== null && $v !== '');

        Log::info('TRACK + REDIRECT', $payload);

        $this->tracking->track($payload);

        return redirect()->away($target);
    }
}
