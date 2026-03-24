<?php

namespace App\Http\Controllers;

use App\Services\ButtonTrackingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ButtonTrackingController extends Controller
{
    public function __construct(
        private ButtonTrackingService $tracking,
    ) {}

    public function track(Request $request): JsonResponse
    {
        $payload = [
            'button_id' => $request->input('button_id'),
            'button_label' => $request->input('button_label'),
            'button_name' => $request->input('button_name'),
            'page' => $request->input('page'),
            'metadata' => $request->input('metadata', []),
        ];

        $payload = array_filter($payload, fn ($v) => $v !== null && $v !== '');

        $ok = $this->tracking->track($payload);

        return response()->json(['success' => $ok]);
    }

    /**
     * Track buton tıklaması ve redirect. JS kullanılmadan server-side tracking.
     */
    public function trackAndRedirect(Request $request): RedirectResponse|JsonResponse
    {
        $valid = Validator::make($request->query(), [
            'redirect' => 'required|string',
            'button_id' => 'nullable|string|max:255',
            'button_label' => 'nullable|string|max:255',
        ])->valid();

        $redirect = $valid['redirect'];

        if (str_starts_with($redirect, '/')) {
            $target = url($redirect);
        } elseif (filter_var($redirect, FILTER_VALIDATE_URL)) {
            $target = $redirect;
        } else {
            return response()->json(['error' => 'Invalid redirect'], 400);
        }

        $payload = [
            'button_id' => $valid['button_id'] ?? null,
            'button_label' => $valid['button_label'] ?? null,
            'page' => $request->header('Referer') ?? $request->fullUrl(),
        ];
        $payload = array_filter($payload, fn ($v) => $v !== null && $v !== '');

        if (!empty($payload)) {
            $this->tracking->track($payload);
            Log::info('[ButtonTracking] Tracked', ['payload' => $payload, 'redirect' => $target]);
        }

        return redirect()->away($target);
    }
}
