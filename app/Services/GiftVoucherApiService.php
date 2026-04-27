<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GiftVoucherApiService
{
    private const CACHE_PREFIX = 'billing_api_';

    private const CACHE_TTL = 300;

    /**
     *
     *
     * @return array<string, mixed>
     */
    public function getCompaniesRaw(): array
    {
        $key = self::CACHE_PREFIX . config('omr.version', 'v1') . '_companies';

        return Cache::remember($key, self::CACHE_TTL, function () {
            return $this->requestRemote('GET', $this->versionedPath('companies'), []);
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function getInvoicesRaw(array $query = []): array
    {
        $key = self::CACHE_PREFIX . config('omr.version', 'v1') . '_invoices_' . md5(json_encode($query));

        return Cache::remember($key, self::CACHE_TTL, function () use ($query) {
            return $this->requestRemote('GET', $this->versionedPath('invoices'), $query);
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function getInvoiceRaw(string|int $invoice, array $query = []): array
    {
        return $this->requestRemote('GET', $this->versionedPath('invoices/' . urlencode((string) $invoice)), $query);
    }

    /**
     * @param  array<string, mixed>
     * @return array<string, mixed>
     */
    public function createInvoice(array $payload): array
    {
        $companyId = $payload['company_id'] ?? $this->resolveCompanyId();

        if (! $companyId) {
            return [
                '_error' => 'missing_company',
                'message' => 'Billing şirketi bulunamadı.',
                'data' => [],
            ];
        }

        $totalAmount = (float) ($payload['total_amount'] ?? 0);
        $customerName = trim((string) ($payload['customer_name'] ?? ''));
        $customerEmail = trim((string) ($payload['customer_email'] ?? ''));
        $message = trim((string) ($payload['message'] ?? ''));
        $description = trim((string) ($payload['description'] ?? ''));

        if ($message !== '') {
            $description = $description !== ''
                ? $description . ' | Personal message: ' . $message
                : $message;
        }

        $body = array_filter([
            'company_id' => (int) $companyId,
            'invoice_number' => $payload['invoice_number'] ?? $this->generateInvoiceNumber(),
            'customer_name' => $customerName,
            'customer_email' => $customerEmail,
            'total_amount' => $totalAmount,
            'message' => $message,
            'description' => $description,
        ], fn ($value) => $value !== null && $value !== '');

        return $this->requestRemote('POST', $this->versionedPath('invoices'), [], $body);
    }

    /**
     *
     *
     * @return list<array<string, mixed>>
     */
    public function getCompaniesPublic(): array
    {
        $raw = $this->getCompaniesRaw();
        $list = $this->unwrapList($raw);

        return array_values(array_map(fn ($row) => $this->sanitizeCompany($row), $list));
    }

    /**

     *
     * @return array{stripe: array<string, mixed>, paypal: array<string, mixed>, sepa: array<string, mixed>}
     */
    public function getPaymentMethodsPublic(): array
    {
        $list = $this->unwrapList($this->getCompaniesRaw());
        $merged = [
            'stripe' => [
                'enabled' => false,
                'publishable_key' => null,
                'connected_account_id' => null,
                'has_public' => false,
            ],
            'paypal' => [
                'enabled' => false,
                'client_id' => null,
                'merchant_id' => null,
                'has_client_id' => false,
                'mode' => 'live',
            ],
            'sepa' => [
                'enabled' => false,
                'creditor_name' => null,
                'iban_masked' => null,
                'bic' => null,
                'bank_name' => null,
            ],
        ];

        foreach ($list as $row) {
            if (! is_array($row)) {
                continue;
            }
            $s = $this->extractStripe($row);
            if ($s['enabled']) {
                $merged['stripe']['enabled'] = true;
                $merged['stripe']['has_public'] = $merged['stripe']['has_public'] || $s['has_public'];
                if (! empty($s['publishable_key'])) {
                    $merged['stripe']['publishable_key'] = $s['publishable_key'];
                }
                if (! empty($s['connected_account_id'])) {
                    $merged['stripe']['connected_account_id'] = $s['connected_account_id'];
                }
            }
            $p = $this->extractPaypal($row);
            if ($p['enabled']) {
                $merged['paypal']['enabled'] = true;
                $merged['paypal']['has_client_id'] = $merged['paypal']['has_client_id'] || $p['has_client_id'];
                if (! empty($p['client_id'])) {
                    $merged['paypal']['client_id'] = $p['client_id'];
                }
                if (! empty($p['merchant_id'])) {
                    $merged['paypal']['merchant_id'] = $p['merchant_id'];
                }
                $merged['paypal']['mode'] = $p['mode'];
            }
            $e = $this->extractSepa($row);
            if ($e['enabled']) {
                $merged['sepa']['enabled'] = true;
                $merged['sepa'] = array_replace($merged['sepa'], $e);
            }
        }

        return $merged;
    }

    /**
     *
     *
     * @return list<array<string, mixed>>
     */
    public function getInvoicesPublic(array $query = []): array
    {
        $raw = $this->getInvoicesRaw($query);
        $list = $this->unwrapList($raw);

        return array_values(array_map(fn ($row) => $this->sanitizeInvoice($row), $list));
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getInvoicePublic(string|int $invoice, array $query = []): ?array
    {
        $raw = $this->getInvoiceRaw($invoice, $query);
        $data = $raw['data'] ?? null;

        if (! is_array($data)) {
            return null;
        }

        return $this->sanitizeInvoiceDetail($data);
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function sanitizeCompany(array $row): array
    {
        return [
            'id' => $row['id'] ?? null,
            'name' => $row['name'] ?? $row['company_name'] ?? $row['title'] ?? null,
            'slug' => $row['slug'] ?? null,
            'email' => $row['email'] ?? null,
            'tax_no' => $row['tax_no'] ?? null,
            'address' => $row['address'] ?? null,
            'currency' => $row['currency'] ?? $row['default_currency'] ?? 'EUR',
        ];
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function sanitizeInvoice(array $row): array
    {
        $pricing = is_array($row['pricing'] ?? null) ? $row['pricing'] : [];
        $payment = is_array($row['payment'] ?? null) ? $row['payment'] : [];
        $company = is_array($row['company'] ?? null) ? $row['company'] : [];

        return [
            'id' => $row['id'] ?? null,
            'company_id' => $row['company_id'] ?? null,
            'company_name' => $company['name'] ?? null,
            'number' => $row['invoice_number'] ?? $row['number'] ?? $row['reference'] ?? null,
            'status' => $payment['status'] ?? $row['status'] ?? $row['state'] ?? null,
            'total' => $pricing['total_amount'] ?? $row['total'] ?? $row['amount_total'] ?? $row['grand_total'] ?? null,
            'currency' => $row['currency'] ?? 'EUR',
            'issued_at' => $row['invoice_date'] ?? $row['issued_at'] ?? $row['created_at'] ?? $row['date'] ?? null,
            'due_date' => $row['due_date'] ?? null,
            'payment_method' => $payment['method'] ?? null,
            'remaining_amount' => $payment['remaining_amount'] ?? null,
        ];
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function sanitizeInvoiceDetail(array $row): array
    {
        $company = is_array($row['company'] ?? null) ? $row['company'] : [];
        $customer = is_array($row['customer'] ?? null) ? $row['customer'] : [];
        $pricing = is_array($row['pricing'] ?? null) ? $row['pricing'] : [];
        $payment = is_array($row['payment'] ?? null) ? $row['payment'] : [];

        return [
            'id' => $row['id'] ?? null,
            'company_id' => $row['company_id'] ?? null,
            'company_name' => $company['name'] ?? null,
            'invoice_number' => $row['invoice_number'] ?? null,
            'invoice_date' => $row['invoice_date'] ?? null,
            'due_date' => $row['due_date'] ?? null,
            'description' => $row['description'] ?? null,
            'customer_name' => $customer['name'] ?? null,
            'customer_email' => $customer['email'] ?? null,
            'customer_phone' => $customer['phone'] ?? null,
            'customer_address' => $customer['address'] ?? null,
            'subtotal' => $pricing['subtotal'] ?? null,
            'tax_rate' => $pricing['tax_rate'] ?? null,
            'tax_amount' => $pricing['tax_amount'] ?? null,
            'discount' => $pricing['discount'] ?? null,
            'total_amount' => $pricing['total_amount'] ?? null,
            'status' => $payment['status'] ?? null,
            'payment_method' => $payment['method'] ?? null,
            'amount_paid' => $payment['amount_paid'] ?? null,
            'remaining_amount' => $payment['remaining_amount'] ?? null,
            'paid_at' => $payment['paid_at'] ?? null,
            'created_at' => $row['created_at'] ?? null,
        ];
    }

    public function resolveCompanyId(): ?int
    {
        $configured = config('billing.company_id');
        if (is_numeric($configured)) {
            return (int) $configured;
        }

        $companies = $this->getCompaniesPublic();
        $first = $companies[0]['id'] ?? null;

        return is_numeric($first) ? (int) $first : null;
    }

    private function generateInvoiceNumber(): string
    {
        return 'GV-' . now()->format('Ymd-His') . '-' . Str::upper(Str::random(4));
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array{enabled: bool, publishable_key: ?string, has_public: bool, connected_account_id: ?string}
     */
    private function extractStripe(array $row): array
    {
        $block = data_get($row, 'payment_config.stripe')
            ?? data_get($row, 'payment_configuration.stripe')
            ?? data_get($row, 'payments.stripe')
            ?? data_get($row, 'billing.stripe')
            ?? data_get($row, 'stripe')
            ?? [];

        if (! is_array($block)) {
            $block = [];
        }

        $hasPublic = $this->toBool($block['has_public'] ?? false);
        $hasSecret = $this->toBool($block['has_secret'] ?? false);
        $connected = $block['connected_account_id'] ?? null;
        if (is_string($connected)) {
            $connected = trim($connected) !== '' ? $connected : null;
        } else {
            $connected = null;
        }

        $pk = $block['publishable_key'] ?? $block['public_key'] ?? $block['publishableKey'] ?? $row['stripe_publishable_key'] ?? null;
        if (is_string($pk)) {
            $pk = trim($pk) !== '' ? $pk : null;
        } else {
            $pk = null;
        }

        $legacyOn = $this->toBool($block['enabled'] ?? $row['stripe_enabled'] ?? $row['stripe_active'] ?? false);

        $enabled = $hasPublic || $hasSecret || $connected !== null || $pk !== null || $legacyOn;

        return [
            'enabled' => $enabled,
            'publishable_key' => $pk,
            'has_public' => $hasPublic,
            'connected_account_id' => $connected,
        ];
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array{enabled: bool, client_id: ?string, merchant_id: ?string, has_client_id: bool, mode: string}
     */
    private function extractPaypal(array $row): array
    {
        $block = data_get($row, 'payment_config.paypal')
            ?? data_get($row, 'payment_configuration.paypal')
            ?? data_get($row, 'payments.paypal')
            ?? data_get($row, 'billing.paypal')
            ?? data_get($row, 'paypal')
            ?? [];

        if (! is_array($block)) {
            $block = [];
        }

        $hasClientId = $this->toBool($block['has_client_id'] ?? false);

        $merchantId = $block['merchant_id'] ?? null;
        if (is_string($merchantId)) {
            $merchantId = trim($merchantId) !== '' ? $merchantId : null;
        } else {
            $merchantId = null;
        }

        $clientId = $block['client_id'] ?? $block['clientId'] ?? $row['paypal_client_id'] ?? null;
        if (is_string($clientId)) {
            $clientId = trim($clientId) !== '' ? $clientId : null;
        } else {
            $clientId = null;
        }

        $mode = strtolower((string) ($block['mode'] ?? $row['paypal_mode'] ?? 'live'));
        if (! in_array($mode, ['sandbox', 'live'], true)) {
            $mode = 'live';
        }

        $legacyOn = $this->toBool($block['enabled'] ?? $row['paypal_enabled'] ?? $row['paypal_active'] ?? false);

        $enabled = $hasClientId || $merchantId !== null || $clientId !== null || $legacyOn;

        return [
            'enabled' => $enabled,
            'client_id' => $clientId,
            'merchant_id' => $merchantId,
            'has_client_id' => $hasClientId,
            'mode' => $mode,
        ];
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array{enabled: bool, creditor_name: ?string, iban_masked: ?string, bic: ?string, bank_name: ?string}
     */
    private function extractSepa(array $row): array
    {
        $block = data_get($row, 'payment_config.sepa')
            ?? data_get($row, 'payment_configuration.sepa')
            ?? data_get($row, 'payments.sepa')
            ?? data_get($row, 'billing.sepa')
            ?? data_get($row, 'sepa')
            ?? [];

        if (! is_array($block)) {
            $block = [];
        }

        $ibanRaw = isset($block['iban']) ? preg_replace('/\s+/', '', (string) $block['iban']) : '';
        $ibanRaw = $ibanRaw !== '' ? $ibanRaw : null;

        $ibanDisplay = $ibanRaw !== null ? $this->maskIban($ibanRaw) : null;

        $bic = $block['bic'] ?? $row['sepa_bic'] ?? null;
        if (is_string($bic)) {
            $bic = trim($bic) !== '' ? $bic : null;
        } else {
            $bic = null;
        }

        $bankName = $block['bank_name'] ?? null;
        if (is_string($bankName)) {
            $bankName = trim($bankName) !== '' ? $bankName : null;
        } else {
            $bankName = null;
        }

        $creditor = $block['creditor_name'] ?? $block['creditor'] ?? $row['sepa_creditor_name'] ?? null;
        if (is_string($creditor)) {
            $creditor = trim($creditor) !== '' ? $creditor : null;
        } else {
            $creditor = null;
        }

        $ibanMasked = $block['iban_masked'] ?? null;
        if (is_string($ibanMasked)) {
            $ibanMasked = trim($ibanMasked) !== '' ? $ibanMasked : null;
        } else {
            $ibanMasked = null;
        }

        if ($ibanMasked === null && $ibanDisplay !== null) {
            $ibanMasked = $ibanDisplay;
        }

        $hasData = $ibanRaw !== null || $bic !== null || $bankName !== null || $creditor !== null;

        $enabled = $hasData;

        return [
            'enabled' => $enabled,
            'creditor_name' => $creditor,
            'iban_masked' => $ibanMasked,
            'bic' => $bic,
            'bank_name' => $bankName,
        ];
    }

    private function maskIban(string $iban): string
    {
        $clean = preg_replace('/\s+/', '', $iban);
        if (strlen($clean) < 10) {
            return $iban;
        }

        return substr($clean, 0, 4).' **** **** '.substr($clean, -4);
    }

    private function toBool(mixed $v): bool
    {
        if (is_bool($v)) {
            return $v;
        }
        if (is_int($v)) {
            return $v === 1;
        }
        if (is_string($v)) {
            $l = strtolower(trim($v));

            return in_array($l, ['1', 'true', 'yes', 'on'], true);
        }

        return false;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return list<array<string, mixed>>
     */
    private function unwrapList(array $payload): array
    {
        if (isset($payload['data']) && is_array($payload['data'])) {
            $outer = $payload['data'];

            // { "data": { "data": [ {...} ], "pagination": { ... } } }
            if (isset($outer['data']) && is_array($outer['data'])) {
                $inner = $outer['data'];
                if ($inner === []) {
                    return [];
                }
                if (array_is_list($inner)) {
                    return array_values(array_filter($inner, 'is_array'));
                }
                if (isset($inner['id']) && is_array($inner)) {
                    return [$inner];
                }
            }

            if ($outer === []) {
                return [];
            }
            if (array_is_list($outer)) {
                return array_values(array_filter($outer, 'is_array'));
            }
            if (isset($outer['id']) && is_array($outer)) {
                return [$outer];
            }
        }
        if (isset($payload['companies']) && is_array($payload['companies'])) {
            return array_values(array_filter($payload['companies'], 'is_array'));
        }
        if (isset($payload['invoices']) && is_array($payload['invoices'])) {
            return array_values(array_filter($payload['invoices'], 'is_array'));
        }
        if ($payload !== [] && array_is_list($payload) && isset($payload[0]) && is_array($payload[0])) {
            return $payload;
        }

        return [];
    }

    /**
     * @param  array<string, mixed>  $queryParams
     * @return array<string, mixed>
     */
    private function requestRemote(string $method, string $path, array $queryParams = [], array $payload = []): array
    {
        $base = rtrim((string) config('billing.base_url'), '/');
        if ($base === '') {
            return ['_error' => 'BILLING_API_BASE boş', 'data' => []];
        }

        $tenant = config('omr.tenant_id');
        $headerName = (string) config('billing.tenant_header', 'X-Tenant-ID');
        $token = config('billing.token');
        $companyId = config('billing.company_id');

        $q = $queryParams;
        if ($companyId && ! isset($q['company_id'])) {
            $q['company_id'] = $companyId;
        }

        $url = $base.$path;
        if ($q !== []) {
            $url .= '?'.http_build_query($q);
        }

        try {
            $req = Http::timeout((int) config('billing.timeout', 15))
                ->acceptJson();

            if ($token) {
                $req = $req->withToken((string) $token);
            }
            if ($tenant) {
                $req = $req->withHeaders([$headerName => (string) $tenant]);
            }

            $verb = strtoupper($method);
            $response = match ($verb) {
                'POST' => $req->post($url, $payload),
                'PUT' => $req->put($url, $payload),
                'PATCH' => $req->patch($url, $payload),
                'DELETE' => $req->delete($url, $payload),
                default => $req->get($url),
            };

            if (! $response->successful()) {
                $body = $response->json();
                if (! is_array($body)) {
                    $body = $response->body();
                }

                Log::debug('Billing API HTTP hatası', [
                    'url' => $url,
                    'status' => $response->status(),
                    'body' => $body,
                ]);

                return [
                    '_error' => 'http_'.$response->status(),
                    'message' => is_string($body) ? $body : ($body['message'] ?? null),
                    'status' => $response->status(),
                    'request_url' => $url,
                    'response_body' => $body,
                    'data' => [],
                ];
            }

            $json = $response->json();

            return is_array($json) ? $json : ['data' => []];
        } catch (\Throwable $e) {
            Log::debug('Billing API istisna', ['url' => $url, 'error' => $e->getMessage()]);

            return [
                '_error' => 'exception',
                'message' => $e->getMessage(),
                'request_url' => $url,
                'response_body' => null,
                'data' => [],
            ];
        }
    }

    private function versionedPath(string $path): string
    {
        return rtrim((string) config('omr.endpoint_path', '/v1'), '/') . '/' . ltrim($path, '/');
    }
}
