<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SeoController;

Route::get('/tracking', [SeoController::class, 'tracking']);

Route::get('/{any}', [SeoController::class, 'index'])->where('any', '.*');
