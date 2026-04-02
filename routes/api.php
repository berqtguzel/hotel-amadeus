<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ButtonTrackingController;

// 🔐 Default auth route (dokunmadım)
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});


// 🚀 BUTTON TRACKING API (CSRF yok, sendBeacon uyumlu)
Route::prefix('v1')->group(function () {
    Route::post('/button-tracking/track', [ButtonTrackingController::class, 'track'])
        ->name('api.button-tracking.track');
});
