<?php

namespace App\Http\Controllers;

use App\Services\ApiHealthService;
use App\Services\GalleryService;
use App\Services\PageService;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Inertia\Inertia;

class PageController extends Controller
{
    public function __construct(
        private PageService $pageService,
        private ApiHealthService $apiHealth,
        private GalleryService $galleryService,
    ) {}

    public function show(string $locale, string $slug)
    {
        $locale = strtolower($locale);
        $slug = strtolower($slug);
        $tenant = config('omr.main_tenant') ?: config('omr.tenant_id') ?: 'default';
        $cacheKey = "dynamic_page:{$tenant}:{$locale}:{$slug}";

        $pageData = Cache::remember($cacheKey, now()->addDays(7), function () use ($locale, $slug) {
            if ($this->apiHealth->isAvailable()) {
                return $this->pageService->getPage($slug, $locale);
            }

            return $this->getFallbackPage($slug, $locale);
        });

        if (! $pageData) {
            throw new NotFoundHttpException();
        }

        $isGalleryPage = in_array($slug, ['galerie', 'gallery'], true);
        $galleries = [];

        if ($isGalleryPage && $this->apiHealth->isAvailable()) {
            $galleries = $this->galleryService->getGalleries($locale);
        }

        return Inertia::render('Dynamic/Page', [
            'page' => $pageData,
            'locale' => $locale,
            'galleries' => $galleries,
        ]);
    }

    private function getFallbackPage(string $slug, string $locale): ?array
    {
        $pages = [
            'historie' => [
                'title' => $locale === 'en' ? 'History' : ($locale === 'tr' ? 'Tarihçe' : 'Historie'),
                'content' => $locale === 'en'
                    ? '<p>This is a demo page. Replace with real content later.</p>'
                    : ($locale === 'tr'
                        ? '<p>Bu bir demo sayfasıdır. Daha sonra gerçek içerikle değiştirilebilir.</p>'
                        : '<p>Bu bir demo sayfasıdır. Daha sonra gerçek içerikle değiştirilebilir.</p>'),
            ],
            'rooms' => [
                'title' => $locale === 'en' ? 'Rooms' : ($locale === 'tr' ? 'Odalar' : 'Zimmer'),
                'content' => $locale === 'en'
                    ? '<p>Demo rooms description.</p>'
                    : '<p>Demo oda açıklaması.</p>',
            ],
            'spa' => [
                'title' => 'Spa',
                'content' => $locale === 'en'
                    ? '<p>Demo spa content.</p>'
                    : '<p>Demo spa içeriği.</p>',
            ],
        ];

        $data = $pages[$slug] ?? null;

        if (! $data) {
            return null;
        }

        return array_merge($data, [
            'slug' => $slug,
            'locale' => $locale,
            'subtitle' => '',
            'heroImage' => null,
            'blocks' => [],
            'is_demo' => true,
        ]);
    }
}
