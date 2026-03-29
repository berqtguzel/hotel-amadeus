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
use App\Http\Controllers\HotelController;
use App\Services\SliderService;
use App\Services\PageService;
use App\Services\ApiHealthService;

/*
|--------------------------------------------------------------------------
| API & Tracking Routes
|--------------------------------------------------------------------------
*/

Route::get('/api/hotels', [HotelController::class, 'index'])->name('api.hotels');
Route::post('/api/button-tracking/track', [ButtonTrackingController::class, 'track'])->name('button-tracking.track');
Route::get('/track', [ButtonTrackingController::class, 'trackAndRedirect'])->name('button-tracking.redirect');
Route::post('/api/contact/forms/{id}/submit', [ContactFormController::class, 'submit'])->name('contact.forms.submit');

Route::prefix('api/settings')->group(function () {
    Route::get('/', [SettingsController::class, 'index'])->name('settings.index');
    Route::get('/frontend', [SettingsController::class, 'frontend'])->name('settings.frontend');
    Route::get('/{key}', [SettingsController::class, 'show'])->name('settings.show');
    Route::post('/clear-cache', [SettingsController::class, 'clearCache'])->name('settings.clear-cache');
});

Route::prefix('api/billing')->group(function () {
    Route::get('/companies', [GiftVoucherController::class, 'companiesJson'])->name('billing.companies');
    Route::get('/invoices', [GiftVoucherController::class, 'invoicesJson'])->name('billing.invoices');
    Route::post('/invoices', [GiftVoucherController::class, 'createInvoice'])->name('billing.invoices.create');
    Route::get('/invoices/{invoice}', [GiftVoucherController::class, 'invoiceShow'])->name('billing.invoices.show');
});

/*
|--------------------------------------------------------------------------
| Main & Home Routes
|--------------------------------------------------------------------------
*/

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/{locale}', [HomeController::class, 'index'])
    ->where(['locale' => 'de|en|tr']) // Array yapıldı
    ->name('home.locale');

/*
|--------------------------------------------------------------------------
| Entity Routes
|--------------------------------------------------------------------------
*/

// Hotels
Route::get('/hotels', fn () => redirect('/de/hotels'));
Route::get('/{locale}/hotels', [HotelController::class, 'listPage'])
    ->where(['locale' => 'de|en|tr']) // Array yapıldı
    ->name('hotels.index');

Route::get('/{locale}/hotels/{hotel}', function (string $locale, string $hotel) {
    return Inertia::render('Hotels/Show', ['locale' => $locale, 'hotel' => $hotel]);
})->where(['locale' => 'de|en|tr']) // Array yapıldı
  ->name('hotels.show');

Route::get('/hotels/{hotel}', fn ($hotel) => redirect("/de/hotels/{$hotel}"));

// Rooms
Route::get('/{locale}/rooms/{room}', [RoomPageController::class, 'show'])
    ->where(['locale' => 'de|en|tr']) // Array yapıldı
    ->name('rooms.show');

// Offers
Route::get('/{locale}/offers/{offer}', function (string $locale, string $offer) {
    return Inertia::render('Offers/Show', ['locale' => $locale, 'offer' => $offer]);
})->where(['locale' => 'de|en|tr'])->name('offers.show');

// Themes
Route::get('/{locale}/urlaubsthemen/{theme}', function (string $locale, string $theme) {
    return Inertia::render('Themes/Show', ['locale' => $locale, 'theme' => $theme]);
})->where(['locale' => 'de|en|tr'])->name('themes.show');

/*
|--------------------------------------------------------------------------
| Static & Service Pages
|--------------------------------------------------------------------------
*/

// Uber Uns
Route::get('/{locale}/uber-uns', function (string $locale) {
    $locale = strtolower($locale);
    $page = app(ApiHealthService::class)->isAvailable()
            ? app(PageService::class)->getPage('uber-uns', $locale)
            : null;

    return Inertia::render('Home/UberUns', [
        'currentRoute' => 'uberuns',
        'locale' => $locale,
        'page' => $page,
    ]);
})->where(['locale' => 'de|en|tr'])->name('uberuns.locale');

// Kontakt & Artisan
Route::get('/{locale}/kontakt', [ContactController::class, 'index'])->where(['locale' => 'de|en|tr'])->name('contact.index');
Route::get('/{locale}/artisan', [ArtisanCommandController::class, 'index'])->where(['locale' => 'de|en|tr'])->name('artisan.index');

// Gutschein - Hatalı olan kısım burasıydı, düzelttik:
Route::prefix('/{locale}/gutschein')
    ->where(['locale' => 'de|en|tr']) // BURASI ARRAY OLMAK ZORUNDA
    ->group(function () {
        Route::get('/', [GiftVoucherController::class, 'index'])->name('gutschein.index');
        Route::get('/stripe', [GiftVoucherController::class, 'stripe'])->name('gutschein.stripe');
        Route::get('/paypal', [GiftVoucherController::class, 'paypal'])->name('gutschein.paypal');
        Route::get('/sepa', [GiftVoucherController::class, 'sepa'])->name('gutschein.sepa');
        Route::get('/rechnung/{invoice}', [GiftVoucherController::class, 'invoicePage'])->name('gutschein.invoice');
    });

/*
|--------------------------------------------------------------------------
| Dynamic Pages (Catch-all) - EN SONDA
|--------------------------------------------------------------------------
*/

Route::controller(PageController::class)->group(function () {
    Route::get('/{locale}/{slug}', 'show')
        ->where([
            'locale' => 'de|en|tr',
            'slug'   => '[a-z0-9\-]+',
        ])
        ->name('page.show');

    Route::get('/{slug}', function ($slug) {
        return redirect("/de/{$slug}");
    })->where(['slug' => '[a-z0-9\-]+']);
});
