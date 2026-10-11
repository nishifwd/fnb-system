<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'F&B System',
        'health' => '/api/v1/health',
    ]);
});
