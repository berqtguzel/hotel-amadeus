<?php

return [

    'base_url' => rtrim(env('BILLING_API_BASE', 'https://omerdogan.de/api'), '/'),

    'token' => env('BILLING_API_TOKEN'),

    'timeout' => (int) env('BILLING_API_TIMEOUT', 15),

    'tenant_header' => env('BILLING_TENANT_HEADER', 'X-Tenant-ID'),

    'company_id' => env('BILLING_COMPANY_ID'),

];
