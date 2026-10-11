<?php

use App\Http\Controllers\Api\V1\BusinessProfileController;
use App\Http\Controllers\Api\V1\DiningTableController;
use App\Http\Controllers\Api\V1\FloorAreaController;
use App\Http\Controllers\Api\V1\FloorLayoutController;
use App\Http\Controllers\Api\V1\MenuCategoryController;
use App\Http\Controllers\Api\V1\MenuItemController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/health', function () {
        return response()->json([
            'status' => 'ok',
            'service' => 'fnb-system',
        ]);
    });

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
