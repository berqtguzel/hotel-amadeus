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
            'session_id' => 'nullable|string', // ✅ Frontend'den gelen ID'yi kabul et
        ]);

        $payload = $validated;

        // ✅ SESSION_ID: Öncelik frontend'den gelen veri, yoksa cookie
        $payload['session_id'] = $request->input('session_id')
            ?? $request->cookie('werrapark_analytics_sid');

        $payload['metadata'] = $payload['metadata'] ?? [];

        // ✅ URL DÜZELTME: api/v1/... yerine referer (yani kullanıcının olduğu gerçek sayfa)
        $payload['url'] = $validated['url'] ?? $request->header('referer');
        $payload['metadata']['page'] = $validated['page'] ?? $request->header('referer');

        $payload = array_filter($payload, fn ($v) => $v !== null && $v !== '');

        Log::info('📥 TRACKING RECEIVED', $payload);

        $ok = $this->tracking->track($payload);

        return response()->json(['success' => $ok]);
    }

    public function trackAndRedirect(Request $request): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'redirect' => 'required|string',
            'button_id' => 'nullable|string|max:255',
            'button_label' => 'nullable|string|max:255',
            'session_id' => 'nullable|string', // ✅ Buraya da ekledik
        ]);

        $redirect = $validated['redirect'];
        $target = str_starts_with($redirect, '/') ? url($redirect) : $redirect;

        // Whitelist kontrolü (Mevcut mantığın aynısı)
        $allowedDomains = ['omerdogan.de', 'paypal.com', 'stripe.com', 'werrapark.de']; // werrapark'ı eklemeyi unutma
        $host = parse_url($target, PHP_URL_HOST);

        // Eğer domain whitelist dışındaysa ama kendi domaininse izin ver
        if ($host && !in_array($host, $allowedDomains) && $host !== $request->getHost()) {
             return response()->json(['error' => 'Unauthorized redirect'], 403);
        }

        $payload = [
            'event' => 'redirect_click',
            'session_id' => $validated['session_id'] ?? $request->cookie('werrapark_analytics_sid'), // ✅ ID'yi eşle
            'button_id' => $validated['button_id'] ?? null,
            'button_label' => $validated['button_label'] ?? null,
            'url' => $request->header('referer'), // ✅ Gerçek sayfa URL'si
            'metadata' => [
                'page' => $request->header('referer'),
            ],
        ];

        $payload = array_filter($payload, fn ($v) => $v !== null && $v !== '');

        $this->tracking->track($payload);

        return redirect()->away($target);
    }
}
