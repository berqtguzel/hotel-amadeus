<?php

namespace App\Http\Controllers;

use App\Services\HotelService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Http\JsonResponse;

class HotelController extends Controller
{
    protected $hotelService;

    public function __construct(HotelService $hotelService)
    {
        $this->hotelService = $hotelService;
    }

    /**
     * API üzerinden JSON veri dönmek için (Örn: /api/hotels)
     */
    public function index(): JsonResponse
    {
        $hotels = $this->hotelService->getHotels();

        return response()->json([
            'success' => true,
            'hotels' => $hotels
        ]);
    }

    /**
     * React/Inertia Sayfasını Render Etmek İçin (Örn: /de/hotels)
     * Bu metod, React tarafındaki usePage().props içini doldurur.
     */
    public function listPage(string $locale)
    {
        $hotels = $this->hotelService->getHotels();

        return Inertia::render('Hotels/Index', [ // React dosyanın yolu (Pages/Hotels/Index.jsx gibi)
            'hotels' => $hotels,
            'locale' => $locale,
        ]);
    }
}
