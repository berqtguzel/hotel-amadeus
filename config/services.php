<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'tracking' => [
        'url' => env(
            'TRACKING_API_URL',
            rtrim(env('OMR_API_BASE', 'https://omerdogan.de/api'), '/') .
                '/' .
                trim(
                    str_starts_with((string) env('OMR_API_VERSION', 'v1'), 'v')
                        ? (string) env('OMR_API_VERSION', 'v1')
                        : 'v' . env('OMR_API_VERSION', '1'),
                    '/',
                ) .
                '/button-tracking/track',
        ),
        'tenant' => env('TRACKING_TENANT', env('OMR_MAIN_TENANT', env('OMR_TENANT_ID'))),
    ],

];
