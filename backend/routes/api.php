<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BusinessProfileController;
use App\Http\Controllers\Api\V1\DiningTableController;
use App\Http\Controllers\Api\V1\FloorAreaController;
use App\Http\Controllers\Api\V1\FloorLayoutController;
use App\Http\Controllers\Api\V1\MenuCategoryController;
use App\Http\Controllers\Api\V1\MenuItemController;
use App\Http\Controllers\Api\V1\StaffController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/health', function () {
        return response()->json([
            'status' => 'ok',
            'service' => 'fnb-system',
        ]);
    });

    Route::middleware('web')->group(function (): void {
        Route::get('/auth/csrf', [AuthController::class, 'csrf']);
        Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

        Route::middleware('auth')->group(function (): void {
            Route::get('/auth/me', [AuthController::class, 'me']);
            Route::post('/auth/logout', [AuthController::class, 'logout']);

            Route::middleware('can:manage-staff')->group(function (): void {
                Route::get('/staff', [StaffController::class, 'index']);
                Route::post('/staff', [StaffController::class, 'store']);
                Route::delete('/staff/{staff}', [StaffController::class, 'destroy']);
            });

            Route::middleware('can:manage-workspace')->group(function (): void {
                Route::get('/business', [BusinessProfileController::class, 'show']);
                Route::put('/business', [BusinessProfileController::class, 'update']);
                Route::apiResource('categories', MenuCategoryController::class)
                    ->parameters(['categories' => 'menuCategory']);
                Route::apiResource('items', MenuItemController::class)
                    ->parameters(['items' => 'menuItem']);
                Route::apiResource('areas', FloorAreaController::class)
                    ->parameters(['areas' => 'floorArea']);
                Route::get('/layout', [FloorLayoutController::class, 'show']);
                Route::put('/layout', [FloorLayoutController::class, 'update']);
                Route::apiResource('tables', DiningTableController::class)
                    ->parameters(['tables' => 'diningTable']);
            });
        });
    });
});
