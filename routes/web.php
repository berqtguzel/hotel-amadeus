<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\PageController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\ContactFormController;
use App\Http\Controllers\RoomPageController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ArtisanCommandController;
use App\Http\Controllers\ButtonTrackingController;
use App\Http\Controllers\GiftVoucherController;
use App\Http\Controllers\SettingsController;
use App\Services\SliderService;
use App\Services\PageService;
use App\Services\ApiHealthService;

Route::post('/api/button-tracking/track', [ButtonTrackingController::class, 'track'])
    ->name('button-tracking.track');

Route::get('/track', [ButtonTrackingController::class, 'trackAndRedirect'])
    ->name('button-tracking.redirect');

Route::post('/api/contact/forms/{id}/submit', [ContactFormController::class, 'submit'])->name('contact.forms.submit');

Route::get('/api/settings', [SettingsController::class, 'index'])->name('settings.index');
Route::get('/api/settings/frontend', [SettingsController::class, 'frontend'])->name('settings.frontend');
Route::get('/api/settings/{key}', [SettingsController::class, 'show'])->name('settings.show');
Route::post('/api/settings/clear-cache', [SettingsController::class, 'clearCache'])->name('settings.clear-cache');

Route::get('/api/billing/companies', [GiftVoucherController::class, 'companiesJson'])->name('billing.companies');
Route::get('/api/billing/invoices', [GiftVoucherController::class, 'invoicesJson'])->name('billing.invoices');

Route::get('/api/slider/debug', function () {
    $locale = request()->query('locale', 'de');
    $slug = config('omr.hero_slider_slug', 'hero');
    $slider = app(SliderService::class)->getSlider($slug, $locale);
    return response()->json([
        'config' => [
            'base_url' => config('omr.base_url'),
            'endpoint' => config('omr.endpoint'),
            'tenant_set' => !empty(config('omr.tenant_id')) || !empty(config('omr.main_tenant')),
            'hero_slider_slug' => $slug,
        ],
        'slider' => $slider,
    ]);
})->name('slider.debug');

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('/{locale}/uber-uns', function (string $locale) {
    $locale = strtolower($locale);
    $slug = 'uber-uns';
    $page = null;
    if (app(ApiHealthService::class)->isAvailable()) {
        $page = app(PageService::class)->getPage($slug, $locale);
    }

    return Inertia::render('Home/UberUns', [
        'currentRoute' => 'uberuns',
        'locale' => $locale,
        'page' => $page,
    ]);
})->where('locale', 'de|en|tr')->name('uberuns.locale');

Route::get('/uber-uns', fn () => redirect('/de/uber-uns'))->name('uberuns');

Route::get('/{locale}', [HomeController::class, 'index'])
    ->where('locale', 'de|en|tr')
    ->name('home.locale');

Route::get('/{locale}/kontakt', [ContactController::class, 'index'])->where('locale', 'de|en|tr')->name('contact.index');
Route::post('/{locale}/kontakt', [ContactController::class, 'store'])->where('locale', 'de|en|tr')->name('contact.store');

Route::get('/artisan', fn () => redirect('/de/artisan'))->name('artisan.redirect');
Route::get('/{locale}/artisan', [ArtisanCommandController::class, 'index'])
    ->where('locale', 'de|en|tr')
    ->name('artisan.index');
Route::post('/{locale}/artisan/run', [ArtisanCommandController::class, 'run'])
    ->where('locale', 'de|en|tr')
    ->name('artisan.run');

// Spezifische Urlaubsthemen-Detailseiten (z.B. /de/urlaubsthemen/wellness)
Route::get('/{locale}/urlaubsthemen/{theme}', function (string $locale, string $theme) {
    return Inertia::render('Themes/Show', [
        'locale' => $locale,
        'theme'  => $theme,
    ]);
})->where([
    'locale' => 'de|en|tr',
])->name('themes.show');

// Fallback ohne Locale → nach /de/urlaubsthemen/{theme} umleiten
Route::get('/urlaubsthemen/{theme}', function (string $theme) {
    return redirect("/de/urlaubsthemen/{$theme}");
});

// Hotels-Detailseiten (z.B. /de/hotels/heubach)
Route::get('/{locale}/hotels/{hotel}', function (string $locale, string $hotel) {
    return Inertia::render('Hotels/Show', [
        'locale' => $locale,
        'hotel'  => $hotel,
    ]);
})->where([
    'locale' => 'de|en|tr',
])->name('hotels.show');

// Fallback ohne Locale → nach /de/hotels/{hotel} umleiten
Route::get('/hotels/{hotel}', function (string $hotel) {
    return redirect("/de/hotels/{$hotel}");
});

Route::get('/{locale}/rooms/{room}', [RoomPageController::class, 'show'])
    ->where([
        'locale' => 'de|en|tr',
    ])
    ->name('rooms.show');

// Fallback ohne Locale -> nach /de/rooms/{room} umleiten
Route::get('/rooms/{room}', function (string $room) {
    return redirect("/de/rooms/{$room}");
});

// Angebots-Detailseiten (z.B. /de/offers/ai-heubach)
Route::get('/{locale}/offers/{offer}', function (string $locale, string $offer) {
    return Inertia::render('Offers/Show', [
        'locale' => $locale,
        'offer'  => $offer,
    ]);
})->where([
    'locale' => 'de|en|tr',
])->name('offers.show');

// Fallback ohne Locale → nach /de/offers/{offer} umleiten
Route::get('/offers/{offer}', function (string $offer) {
    return redirect("/de/offers/{$offer}");
});

// Geschenkgutschein (Stripe / PayPal / SEPA — spät zuerst)
Route::get('/{locale}/gutschein/stripe', [GiftVoucherController::class, 'stripe'])
    ->where('locale', 'de|en|tr')
    ->name('gutschein.stripe');
Route::get('/{locale}/gutschein/paypal', [GiftVoucherController::class, 'paypal'])
    ->where('locale', 'de|en|tr')
    ->name('gutschein.paypal');
Route::get('/{locale}/gutschein/sepa', [GiftVoucherController::class, 'sepa'])
    ->where('locale', 'de|en|tr')
    ->name('gutschein.sepa');
Route::get('/{locale}/gutschein', [GiftVoucherController::class, 'index'])
    ->where('locale', 'de|en|tr')
    ->name('gutschein.index');

Route::get('/gutschein', fn () => redirect('/de/gutschein'));

Route::controller(PageController::class)->group(function () {

    // Panel'den gelen tüm sayfa slug'ları (about, historie, galerie vb.)
    // /de/about, /de/historie gibi - API'den sayfa varsa göster, yoksa fallback
    Route::get('/{locale}/{slug}', 'show')
        ->where([
            'locale' => 'de|en|tr',
            'slug'   => '[a-z0-9\-]+',
        ])
        ->name('page.show');

    // Locale olmadan /about yazılırsa /de/about'a yönlendir
    Route::get('/{slug}', function ($slug) {
        return redirect("/de/{$slug}");
    })->where('slug', '[a-z0-9\-]+');
});
