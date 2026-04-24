<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\PartnerService;

class PartnerController extends Controller
{
    private PartnerService $partnerService;

    public function __construct(PartnerService $partnerService)
    {
        $this->partnerService = $partnerService;
    }

    /**
     * Tüm partnerleri listeler
     * GET /partners
     */
    public function index(Request $request): array
    {
        $locale = $request->query('locale') ?? $request->route('locale') ?? config('omr.default_locale', 'de');
        $tenantId = config('omr.tenant_id') ?: config('omr.main_tenant') ?: '';

        if (!$tenantId) {
            return [];
        }

        $partners = $this->partnerService->getAll($locale);

        // İstersen JSON Response yerine doğrudan array dönebilirsin, Route::get bunu otomatik JSON yapar.
        return $partners;
    }

    /**
     * Tek bir partnerin detayını getirir
     * GET /partners/{identifier} (identifier: id veya slug)
     */
    public function show(Request $request, string $identifier)
    {
        $locale = $request->query('locale') ?? $request->route('locale') ?? config('omr.default_locale', 'de');
        $tenantId = config('omr.tenant_id') ?: config('omr.main_tenant') ?: '';

        if (!$tenantId) {
            return response()->json(['error' => 'Tenant ID missing'], 400);
        }

        $partner = $this->partnerService->get($identifier, $locale);

        if (empty($partner)) {
            return response()->json(['error' => 'Partner not found'], 404);
        }

        return $partner;
    }

    /**
     * Cache temizleme işlemi
     * POST veya GET /partners/clear-cache
     */
    public function clearCache(): array
    {
        $this->partnerService->clearCache();

        return [
            'success' => true,
            'message' => 'Partner cache cleared successfully'
        ];
    }
}
