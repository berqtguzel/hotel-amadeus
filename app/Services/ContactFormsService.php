<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ContactFormsService
{
    private const CACHE_KEY_PREFIX = 'omr_contact_forms_';

    public function getContactForms(string $locale): array
    {
        $locale  = strtolower($locale);
        $cacheKey = $this->cacheKey($locale);

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($locale) {
            return $this->fetch($locale);
        });
    }

    public function clearCache(): void
    {
        foreach (['de', 'en', 'tr'] as $locale) {
            Cache::forget($this->cacheKey($locale));
        }
    }

    private function fetch(string $locale): array
    {
        $base     = rtrim(config('omr.base_url'), '/');
        $endpoint = rtrim(config('omr.endpoint'), '/');
        $tenant   = config('omr.main_tenant') ?: config('omr.tenant_id');

        if (!$tenant || !$base) {
            return [];
        }

        $url = "{$base}{$endpoint}/contact/forms";

        try {
            $response = Http::withoutVerifying()
                ->timeout(30)
                ->connectTimeout(10)
                ->withHeaders([
                    'Accept'      => 'application/json',
                    'X-Tenant-ID' => $tenant,
                ])
                ->get($url, [
                    'tenant' => $tenant,
                    'locale' => $locale,
                    'lang'   => $locale,
                ]);

            if (!$response->successful()) {
                Log::debug('Contact forms API failed', ['status' => $response->status()]);
                return [];
            }

            $json = $response->json();
            $data = $json['data'] ?? $json;

            if (!is_array($data)) {
                return [];
            }

            return $this->normalize($data, $base);
        } catch (\Throwable $e) {
            Log::debug('Contact forms API error', ['error' => $e->getMessage()]);
            return [];
        }
    }

    private function normalize(array $data, string $base): array
    {
        $out = [
            'contactInfo'  => [
                'address' => '',
                'phone'   => '',
                'email'   => '',
            ],
            'formFields'   => [],
            'forms'        => [],
        ];

        $forms = $data['forms'] ?? $data['items'] ?? null;
        if ($forms === null && isset($data[0]) && is_array($data[0])) {
            $forms = $data;
        }
        if (isset($forms['forms'])) {
            $forms = $forms['forms'];
        }
        if (!is_array($forms)) {
            $forms = [];
        }

        foreach ($forms as $form) {
            if (!is_array($form)) {
                continue;
            }
            $attrs = $form['attributes'] ?? $form;
            $type  = strtolower($attrs['type'] ?? $attrs['slug'] ?? 'general');

            $people = $attrs['people'] ?? $attrs['contacts'] ?? $attrs['items'] ?? [$form];

            if ($type === 'executives' || $type === 'executive') {
                continue;
            } elseif ($type === 'reservations' || $type === 'reservation') {
                continue;
            } elseif (isset($attrs['fields'])) {
                $normalized = $this->normalizeFields($attrs['fields']);
                $out['formFields'] = array_merge($out['formFields'], $normalized);
                if ($attrs['is_active'] ?? true) {
                    $out['forms'][] = [
                        'id'     => $attrs['id'] ?? null,
                        'name'   => $attrs['name'] ?? '',
                        'fields' => $normalized,
                    ];
                }
            }
        }

        if (empty($out['formFields']) && !empty($forms)) {
            foreach ($forms as $form) {
                if (!is_array($form) || empty($form['fields'])) {
                    continue;
                }
                if ($form['is_active'] ?? true) {
                    $normalized = $this->normalizeFields($form['fields']);
                    $out['formFields'] = $normalized;
                    $out['forms']     = [['id' => $form['id'] ?? null, 'name' => $form['name'] ?? '', 'fields' => $normalized]];
                    break;
                }
            }
        }

        if (isset($data['contactInfo']) && is_array($data['contactInfo'])) {
            $ci = $data['contactInfo'];
            $out['contactInfo'] = [
                'address' => $ci['address'] ?? $ci['street'] ?? '',
                'phone'   => $ci['phone'] ?? $ci['tel'] ?? '',
                'email'   => $ci['email'] ?? $ci['mail'] ?? '',
            ];
        }

        return $out;
    }

    private function normalizeFields(array $fields): array
    {
        $out = [];

        foreach ($fields as $f) {
            if (!is_array($f)) {
                continue;
            }
            $label = $f['label'] ?? $f['name'] ?? $f['key'] ?? '';
            $name  = $f['name'] ?? $f['key'] ?? $label;
            $out[] = [
                'name'        => is_string($name) ? strtolower($name) : '',
                'type'        => $f['type'] ?? 'text',
                'label'       => $label,
                'placeholder' => $f['placeholder'] ?? $label,
                'required'    => (bool) ($f['required'] ?? false),
            ];
        }

        return $out;
    }

    private function cacheKey(string $locale): string
    {
        $tenant = config('omr.main_tenant') ?: config('omr.tenant_id') ?: 'default';
        $version = config('omr.version', 'v1');

        return self::CACHE_KEY_PREFIX . $version . ':' . $tenant . ':' . strtolower($locale);
    }
}
