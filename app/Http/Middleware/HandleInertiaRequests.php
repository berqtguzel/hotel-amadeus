<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Tightenco\Ziggy\Ziggy;

use App\Services\MenuService;
use App\Services\ApiHealthService;
use App\Services\WidgetService;
use App\Services\SettingsService;
use App\Services\StaffService;
use App\Services\ReviewsService;
use App\Services\ContactFormsService;
use App\Services\SliderService;
use App\Services\HotelService;
use App\Services\HolidayThemeService;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    private const HOME_ROUTES = ['home', 'home.locale'];

    public function __construct(
        private MenuService $menuService,
        private ApiHealthService $apiHealthService,
        private WidgetService $widgetService,
        private SettingsService $settingsService,
        private StaffService $staffService,
        private ReviewsService $reviewsService,
        private ContactFormsService $contactFormsService,
        private SliderService $sliderService,
        private HotelService $hotelService,
        private HolidayThemeService $holidayThemeService,
    ) {}

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $locale = $request->route('locale') ?? 'de';
        $routeName = $request->route()?->getName() ?? '';

        $health = $this->apiHealthService->check();
        $apiUp = $health['success'] ?? false;

        // Route Kontrolleri
        $isHomeRoute = in_array($routeName, self::HOME_ROUTES, true);

        // Veri ihtiyaçlarını belirleyelim
        $needsHotels       = $isHomeRoute || $routeName === 'hotels.show' || str_contains($routeName, 'hotel');
        $needsThemes       = $isHomeRoute || $routeName === 'offers.show';
        $needsTravelThemes = $isHomeRoute;
        $needsStaff        = $isHomeRoute || $routeName === 'contact.index';

        // 🔥 DÜZELTME: Yorumlar hem ana sayfada hem de iletişim/yorum sayfalarında yüklensin
        $needsReviews      = $isHomeRoute || $routeName === 'contact.index' || str_contains($routeName, 'review');

        $needsContactForms = $routeName === 'contact.index';
        $needsSlider       = $isHomeRoute;

        // Holiday Themes İşleme
        $holidayThemes = ($apiUp && ($needsThemes || $needsTravelThemes))
            ? $this->holidayThemeService->getThemes($locale)
            : [];

        $themeGroups = $holidayThemes !== []
            ? $this->holidayThemeService->splitThemesByFile($holidayThemes)
            : ['offers' => [], 'travelThemes' => []];

        return array_merge(parent::share($request), [
            'flash' => [
                'commandResult' => $request->session()->get('commandResult'),
                'success'       => $request->session()->get('success'),
            ],

            'global' => [
                'locale'       => $locale,
                'menu'         => $apiUp ? $this->menuService->getMenu($locale) : [],
                'hotels'       => ($apiUp && $needsHotels) ? $this->hotelService->getHotels() : [],
                'offerThemes'  => $themeGroups['offers'],
                'travelThemes' => $themeGroups['travelThemes'],
                'widgets'      => $apiUp ? $this->widgetService->getWidgets($locale) : $this->emptyWidgets(),
                'settings'     => $apiUp ? $this->settingsService->getForFrontend($locale) : $this->emptySettings(),
                'staff'        => ($apiUp && $needsStaff) ? $this->staffService->getStaff($locale) : [],

                // Yorumlar burada yükleniyor
                'reviews'      => ($apiUp && $needsReviews) ? $this->reviewsService->getReviews($locale) : [],

                'contactForms' => ($apiUp && $needsContactForms) ? $this->contactFormsService->getContactForms($locale) : $this->emptyContactForms(),
                'slider'       => ($apiUp && $needsSlider)
                    ? $this->sliderService->getSlider(config('omr.hero_slider_slug', 'hero'), $locale)
                    : null,
            ],

            // SSR için zorunlu: Closure/LazyProp JSON'a çevrilemez, SSR gateway POST'u patlatır.
            // Ziggy payload'ı doğrudan array olarak paylaşıyoruz.
            'ziggy' => array_merge(
                (new Ziggy)->toArray(),
                ['location' => $request->url()]
            ),
        ]);
    }

    private function emptyWidgets(): array
    {
        return [
            'ratings' => [],
            'whatsapp' => [],
            'serviceHighlights' => [],
        ];
    }

    private function emptySettings(): array
    {
        return [
            'general'     => [],
            'contact'     => [],
            'social'      => [],
            'branding'    => [],
            'colors'      => [],
            'footer'      => [],
            'seo'         => [],
            'analytics'   => [],
            'custom_code' => [],
        ];
    }

    private function emptyContactForms(): array
    {
        return [
            'contactInfo' => [
                'address' => '',
                'phone'   => '',
                'email'   => '',
            ],
            'formFields' => [],
            'forms'      => [],
        ];
    }

    public function rootView(Request $request)
{
    return 'app';
}
}
