<?php

namespace App\Http\Controllers;

use App\Services\ApiHealthService;
use App\Services\GalleryService;
use App\Services\PageService;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

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
        $cacheKey = 'dynamic_page:' . config('omr.version', 'v1') . ":{$tenant}:{$locale}:{$slug}";

        $pageData = Cache::remember($cacheKey, now()->addDays(7), function () use ($locale, $slug) {
            if (!$this->apiHealth->isAvailable()) {
                return null;
            }

            return $this->pageService->getPage($slug, $locale);
        });

        if (!$pageData) {
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
}
