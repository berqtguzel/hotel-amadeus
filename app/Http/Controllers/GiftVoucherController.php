<?php

namespace App\Http\Controllers;

use App\Services\GiftVoucherApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GiftVoucherController extends Controller
{
    public function __construct(
        private GiftVoucherApiService $billing,
    ) {}

    /**
     * @return array<string, mixed>
     */
    private function sharedPayload(string $locale): array
    {
        $locale = strtolower($locale);
        $companiesRaw = $this->billing->getCompaniesRaw();

        return [
            'locale' => $locale,
            'currentRoute' => 'gutschein',
            'companies' => $this->billing->getCompaniesPublic(),
            'paymentMethods' => $this->billing->getPaymentMethodsPublic(),
            'billingApi' => [
                'ok' => empty($companiesRaw['_error']),
                'message' => $companiesRaw['message'] ?? ($companiesRaw['_error'] ?? null),
                'error' => $companiesRaw['_error'] ?? null,
                'status' => $companiesRaw['status'] ?? null,
                'requestUrl' => $companiesRaw['request_url'] ?? null,
                'details' => $companiesRaw['response_body'] ?? null,
            ],
        ];
    }

    public function index(string $locale): Response
    {
        return Inertia::render('GiftVoucher/Index', $this->sharedPayload($locale));
    }

    public function stripe(string $locale): Response
    {
        return Inertia::render('GiftVoucher/CheckoutStripe', array_merge(
            $this->sharedPayload($locale),
            ['checkoutMethod' => 'stripe']
        ));
    }

    public function paypal(string $locale): Response
    {
        return Inertia::render('GiftVoucher/CheckoutPaypal', array_merge(
            $this->sharedPayload($locale),
            ['checkoutMethod' => 'paypal']
        ));
    }

    public function sepa(string $locale): Response
    {
        return Inertia::render('GiftVoucher/CheckoutSepa', array_merge(
            $this->sharedPayload($locale),
            ['checkoutMethod' => 'sepa']
        ));
    }

    /**
     * Uzak API: GET /v1/companies — güvenli özet + ödeme yöntemleri.
     */
    public function companiesJson(): JsonResponse
    {
        return response()->json([
            'data' => $this->billing->getCompaniesPublic(),
            'payment_methods' => $this->billing->getPaymentMethodsPublic(),
        ]);
    }

    /**
     * Uzak API: GET /v1/invoices — sorgu parametreleri aynen iletilir.
     * (Gutschein-UI listelemez; Rechnung nach erfolgreicher Zahlung / eigener Route.)
     */
    public function invoicesJson(Request $request): JsonResponse
    {
        $query = array_filter($request->query(), fn ($v) => $v !== null && $v !== '');

        return response()->json([
            'data' => $this->billing->getInvoicesPublic($query),
        ]);
    }
}
