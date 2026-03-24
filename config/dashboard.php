<?php

return [
    'send_backup_email' => env('CONTACT_SEND_BACKUP_EMAIL', true),

    'dashboard' => [
        'api_url' => env('DASHBOARD_API_URL', 'https://api.dashboard.example.com'),
        'api_key' => env('DASHBOARD_API_KEY'),
        'site_id' => env('DASHBOARD_SITE_ID'),
        'version' => 'v1',
        'endpoints' => [
            'auth' => '/auth',
            'content' => '/sites/{site_id}/content',
            'services' => '/sites/{site_id}/services',
            'locations' => '/sites/{site_id}/locations',
            'contacts' => '/sites/{site_id}/contacts',
            'media' => '/sites/{site_id}/media',
            'settings' => '/sites/{site_id}/settings',
            'analytics' => '/sites/{site_id}/analytics'
        ],
        'cache' => [
            'ttl' => env('DASHBOARD_CACHE_TTL', 3600), // 1 saat
            'prefix' => 'dashboard_'
        ]
    ]
];
