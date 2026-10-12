<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BillingController;
use App\Http\Controllers\Api\V1\BusinessProfileController;
use App\Http\Controllers\Api\V1\DiningTableController;
use App\Http\Controllers\Api\V1\FloorAreaController;
use App\Http\Controllers\Api\V1\FloorLayoutController;
use App\Http\Controllers\Api\V1\MenuCategoryController;
use App\Http\Controllers\Api\V1\MenuItemController;
use App\Http\Controllers\Api\V1\OrderController;
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
            Route::get('/service/catalog', [OrderController::class, 'catalog']);
            Route::get('/orders', [OrderController::class, 'index']);
            Route::post('/orders', [OrderController::class, 'store']);
            Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
            Route::get('/billing/orders', [BillingController::class, 'index']);
            Route::get('/billing/orders/{order}', [BillingController::class, 'show']);
            Route::post('/billing/orders/{order}/payment', [BillingController::class, 'pay']);
            Route::get('/business/payment-qr', [BusinessProfileController::class, 'paymentQr'])->middleware('can:place-orders');

            Route::middleware('can:manage-staff')->group(function (): void {
                Route::get('/staff', [StaffController::class, 'index']);
                Route::post('/staff', [StaffController::class, 'store']);
                Route::delete('/staff/{staff}', [StaffController::class, 'destroy']);
            });

            Route::middleware('can:manage-workspace')->group(function (): void {
                Route::get('/business', [BusinessProfileController::class, 'show']);
                Route::put('/business', [BusinessProfileController::class, 'update']);
                Route::post('/business/payment-qr', [BusinessProfileController::class, 'uploadPaymentQr']);
                Route::delete('/business/payment-qr', [BusinessProfileController::class, 'removePaymentQr']);
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
