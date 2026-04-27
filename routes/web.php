<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\PageController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\ContactFormController;
use App\Http\Controllers\RoomPageController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ButtonTrackingController;
use App\Http\Controllers\GiftVoucherController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\HotelController;
use App\Http\Controllers\ThemeController;
use App\Http\Controllers\ReviewsController;
use App\Http\Controllers\PartnerController;
use App\Services\CouponService;
use App\Services\PageService;
use App\Services\ReviewsService;
use App\Services\ApiHealthService;
use App\Services\SettingsService;
use App\Services\HolidayThemeService;
use App\Services\HotelService;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/*
|--------------------------------------------------------------------------
| API ROUTES
|--------------------------------------------------------------------------
*/

Route::get('/api/hotels', [HotelController::class, 'index']);
Route::post('/api/contact/forms/{id}/submit', [ContactFormController::class, 'submit']);

Route::prefix('api/settings')->group(function () {
    Route::get('/', [SettingsController::class, 'index']);
    Route::get('/frontend', [SettingsController::class, 'frontend']);
});

Route::prefix('api/reviews')->group(function () {
    Route::get('/criteria', [ReviewsController::class, 'criteria']);
    Route::get('/{locale}', [ReviewsController::class, 'index']);
    Route::post('/', [ReviewsController::class, 'store']);
});

/*
|--------------------------------------------------------------------------
| WEB ROUTES
|--------------------------------------------------------------------------
*/

// 🔥 API'den locale listesi (fallback ile)
$apiLocales = collect(app(SettingsService::class)->get('languages') ?? [])
    ->pluck('locale')
    ->map(fn($l) => strtolower($l))
    ->toArray();

$fallbackLocales = ['de','en','tr','fr','es','it','pt','ro','pl','bg','hr','ru','sk','cs'];
$locales = array_unique(array_merge($apiLocales, $fallbackLocales));

$localePattern = implode('|', $locales);

// 🔥 homepage
Route::get('/', function () {
    return redirect('/de');
});

// 🔥 HOME (locale ile)
Route::get('/{locale}', [HomeController::class, 'index'])
    ->where(['locale' => $localePattern])
    ->name('home.locale');

// 🔥 HOTELS
Route::get('/{locale}/hotels', [HotelController::class, 'listPage'])
    ->where(['locale' => $localePattern]);

Route::get('/{locale}/hotels/{hotel}', function ($locale, $hotel, HotelService $hotelService) {

    $hotels = $hotelService->getHotels();

    $exists = collect($hotels)->contains(function ($item) use ($hotel) {
        return (string)($item['id'] ?? '') === (string)$hotel
            || ($item['slug'] ?? '') === $hotel;
    });

    if (!$exists) {
        throw new NotFoundHttpException();
    }

    return Inertia::render('Hotels/Show', compact('locale', 'hotel'));
})->where(['locale' => $localePattern]);

// 🔥 ROOMS
Route::get('/{locale}/rooms/{room}', [RoomPageController::class, 'show'])
    ->where(['locale' => $localePattern]);

// 🔥 OFFERS
Route::get('/{locale}/offers/{offer}', function ($locale, $offer, HolidayThemeService $service) {

    $offers = $service->getThemes($locale);

    $exists = collect($offers)->contains(fn($item) =>
        ($item['slug'] ?? '') === $offer
    );

    if (!$exists) {
        throw new NotFoundHttpException();
    }

    return Inertia::render('Offers/Show', compact('locale', 'offer'));
})->where(['locale' => $localePattern]);

// 🔥 COUPONS
Route::get('/{locale}/coupons', function ($locale, CouponService $service) {
    return Inertia::render('Coupons/Index', [
        'locale' => $locale,
        'coupons' => $service->getCoupons(),
    ]);
})->where(['locale' => $localePattern]);

// 🔥 THEMES
Route::get('/{locale}/urlaubsthemen/{theme}', [ThemeController::class, 'show'])
    ->where(['locale' => $localePattern]);

// 🔥 ABOUT (fallback var)
Route::get('/{locale}/uber-uns', function ($locale) {

    $page = app(PageService::class)->getPage('uber-uns', $locale);

    if (!$page) {
        $page = app(PageService::class)->getPage('uber-uns', 'de');
    }

    return Inertia::render('Home/UberUns', compact('locale', 'page'));
})->where(['locale' => $localePattern]);

// 🔥 CONTACT
Route::get('/{locale}/kontakt', [ContactController::class, 'index'])
    ->where(['locale' => $localePattern]);

Route::post('/{locale}/kontakt', [ContactController::class, 'store'])
    ->where(['locale' => $localePattern]);

// 🔥 REVIEWS (fallback var)
Route::get('/{locale}/bewertungen', function ($locale, ReviewsService $service) {

    $reviews = $service->getReviews($locale);

    if (empty($reviews)) {
        $reviews = $service->getReviews('de');
    }

    return Inertia::render('Reviews/Index', compact('locale', 'reviews'));
})->where(['locale' => $localePattern]);

// 🔥 PAGE ROUTES
Route::controller(PageController::class)->group(function () use ($localePattern) {

    Route::get('/{locale}/{slug}', 'show')
        ->where([
            'locale' => $localePattern,
            'slug' => "(?!$localePattern)[a-z0-9\-]+",
        ]);

    Route::get('/{slug}', function ($slug) {
        return redirect("/de/{$slug}");
    })->where([
        'slug' => "(?!$localePattern)[a-z0-9\-]+",
    ]);
});

// 🔥 GLOBAL FALLBACK (EN KRİTİK)
Route::fallback(function () use ($locales) {

    $segments = request()->segments();

    if (count($segments) > 0) {
        $locale = strtolower($segments[0]);

        if (in_array($locale, $locales)) {
            // 👉 locale varsa → homepage render et (404 yok)
            return app(HomeController::class)->index($locale);
        }
    }

    return redirect('/de');
});
