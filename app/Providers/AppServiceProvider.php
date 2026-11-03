<?php

namespace App\Providers;

use App\Services\DocumentBranding;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // One uploaded signature for every generated document: invoices and dock receipts.
        View::composer(['invoices.invoice', 'receipts.dock-receipt'], function ($view) {
            $view->with('documentSignature', app(DocumentBranding::class)->forDocuments());
        });
    }
}
