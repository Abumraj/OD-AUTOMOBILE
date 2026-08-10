<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\QuoteController;
use App\Http\Controllers\Api\TrackingController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\TestimonialController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\AuctionController;
use App\Http\Controllers\Api\LegalPageController;
use App\Http\Controllers\Api\DeploymentController;
use App\Http\Controllers\Api\ShippingConfigController;
use App\Http\Controllers\Api\ShipmentImportExportController;
use App\Http\Controllers\Api\DockReceiptController;
use App\Http\Controllers\Api\ImageUploadController;

Route::middleware('api')->group(function () {
    Route::post('/quotes', [QuoteController::class, 'store']);
    Route::post('/tracking', [TrackingController::class, 'track']);

    Route::get('/testimonials', [TestimonialController::class, 'index']);
    Route::get('/testimonials/featured', [TestimonialController::class, 'featured']);

    Route::get('/whatsapp-settings', [AdminDashboardController::class, 'getWhatsAppSettings']);
    Route::get('/contact-settings', [AdminDashboardController::class, 'getContactSettings']);
    Route::post('/contact', [ContactController::class, 'submitMessage']);
    Route::get('/tracking-providers', [AdminDashboardController::class, 'getTrackingProviders']);

    Route::get('/auctions/featured', [AuctionController::class, 'getFeaturedAuctions']);
    Route::post('/auction-requests', [AuctionController::class, 'submitRequest']);

    Route::get('/legal-pages/published', [LegalPageController::class, 'getPublishedPages']);
    Route::get('/legal-pages/{slug}', [LegalPageController::class, 'getPageBySlug']);

    Route::get('/about-us/published', [AdminDashboardController::class, 'getAboutUsSections']);

    Route::get('/carousel/active', [AdminDashboardController::class, 'getCarouselImages']);
    Route::get('/performance-settings', [AdminDashboardController::class, 'getPerformanceSettings']);
    Route::get('/social-media-settings', [AdminDashboardController::class, 'getSocialMediaSettings']);
    Route::get('/general-settings', [AdminDashboardController::class, 'getGeneralSettings']);
    Route::get('/homepage-services', [AdminDashboardController::class, 'getHomepageServices']);
    Route::get('/services', [AdminDashboardController::class, 'getServices']);

    // Admin authentication routes (no middleware)
    Route::post('/admin/login', [AdminDashboardController::class, 'login']);
    Route::post('/admin/logout', [AdminDashboardController::class, 'logout']);
    Route::get('/admin/check-auth', [AdminDashboardController::class, 'checkAuth']);

    // Protected admin routes
    Route::prefix('admin')->middleware('admin.auth')->group(function () {
        Route::get('/stats', [AdminDashboardController::class, 'getStats']);
        Route::get('/kanban', [AdminDashboardController::class, 'getKanbanData']);
        Route::get('/activity', [AdminDashboardController::class, 'getActivityStream']);
        Route::get('/fleet-health', [AdminDashboardController::class, 'getFleetHealth']);
        Route::get('/quotes', [AdminDashboardController::class, 'getQuotes']);
        Route::post('/quotes/{id}/approve', [AdminDashboardController::class, 'approveQuote']);
        Route::delete('/quotes/{id}/reject', [AdminDashboardController::class, 'rejectQuote']);
        Route::patch('/shipments/{id}/status', [AdminDashboardController::class, 'updateShipmentStatus']);

        Route::get('/testimonials', [AdminDashboardController::class, 'getTestimonials']);
        Route::post('/testimonials', [AdminDashboardController::class, 'createTestimonial']);
        Route::put('/testimonials/{id}', [AdminDashboardController::class, 'updateTestimonial']);
        Route::delete('/testimonials/{id}', [AdminDashboardController::class, 'deleteTestimonial']);
        Route::post('/testimonials/{id}/toggle-featured', [AdminDashboardController::class, 'toggleFeatured']);

        Route::get('/whatsapp-settings', [AdminDashboardController::class, 'getWhatsAppSettings']);
        Route::put('/whatsapp-settings', [AdminDashboardController::class, 'updateWhatsAppSettings']);

        Route::get('/contact-settings', [AdminDashboardController::class, 'getContactSettings']);
        Route::put('/contact-settings', [AdminDashboardController::class, 'updateContactSettings']);
        Route::get('/contact-messages', [AdminDashboardController::class, 'getContactMessages']);
        Route::put('/contact-messages/{id}', [AdminDashboardController::class, 'updateContactMessageStatus']);
        Route::delete('/contact-messages/{id}', [AdminDashboardController::class, 'deleteContactMessage']);

        Route::get('/tracking-settings', [AdminDashboardController::class, 'getTrackingSettings']);
        Route::put('/tracking-settings', [AdminDashboardController::class, 'updateTrackingSettings']);

        Route::get('/shipments', [AdminDashboardController::class, 'getShipments']);
        Route::get('/shipments/{id}', [AdminDashboardController::class, 'getShipment']);
        Route::post('/shipments', [AdminDashboardController::class, 'createShipment']);
        Route::put('/shipments/{id}', [AdminDashboardController::class, 'updateShipment']);
        Route::delete('/shipments/{id}', [AdminDashboardController::class, 'deleteShipment']);
        Route::post('/shipments/{id}/updates', [AdminDashboardController::class, 'addShipmentUpdate']);

        Route::get('/auctions', [AdminDashboardController::class, 'getAuctions']);
        Route::get('/auctions/{id}', [AdminDashboardController::class, 'getAuction']);
        Route::post('/auctions', [AdminDashboardController::class, 'createAuction']);
        Route::put('/auctions/{id}', [AdminDashboardController::class, 'updateAuction']);
        Route::delete('/auctions/{id}', [AdminDashboardController::class, 'deleteAuction']);
        Route::post('/auctions/{id}/bids', [AdminDashboardController::class, 'addBid']);
        Route::get('/auction-requests', [AdminDashboardController::class, 'getAuctionRequests']);
        Route::put('/auction-requests/{id}', [AdminDashboardController::class, 'updateAuctionRequestStatus']);

        Route::get('/legal-pages', [AdminDashboardController::class, 'getLegalPages']);
        Route::get('/legal-pages/{id}', [AdminDashboardController::class, 'getLegalPage']);
        Route::post('/legal-pages', [AdminDashboardController::class, 'createLegalPage']);
        Route::put('/legal-pages/{id}', [AdminDashboardController::class, 'updateLegalPage']);
        Route::delete('/legal-pages/{id}', [AdminDashboardController::class, 'deleteLegalPage']);

        Route::get('/search-shipments', [AdminDashboardController::class, 'searchShipments']);

        Route::get('/about-us', [AdminDashboardController::class, 'getAboutUsSections']);
        Route::post('/about-us', [AdminDashboardController::class, 'createAboutUsSection']);
        Route::get('/about-us/{id}', [AdminDashboardController::class, 'getAboutUsSection']);
        Route::put('/about-us/{id}', [AdminDashboardController::class, 'updateAboutUsSection']);
        Route::delete('/about-us/{id}', [AdminDashboardController::class, 'deleteAboutUsSection']);

        Route::get('/carousel', [AdminDashboardController::class, 'getCarouselImages']);
        Route::get('/carousel/{id}', [AdminDashboardController::class, 'getCarouselImage']);
        Route::post('/carousel', [AdminDashboardController::class, 'createCarouselImage']);
        Route::put('/carousel/{id}', [AdminDashboardController::class, 'updateCarouselImage']);
        Route::delete('/carousel/{id}', [AdminDashboardController::class, 'deleteCarouselImage']);

        Route::get('/performance-settings', [AdminDashboardController::class, 'getPerformanceSettings']);
        Route::post('/performance-settings', [AdminDashboardController::class, 'updatePerformanceSettings']);

        Route::get('/social-media-settings', [AdminDashboardController::class, 'getSocialMediaSettings']);
        Route::put('/social-media-settings', [AdminDashboardController::class, 'updateSocialMediaSettings']);

        Route::get('/general-settings', [AdminDashboardController::class, 'getGeneralSettings']);
        Route::put('/general-settings', [AdminDashboardController::class, 'updateGeneralSettings']);

        Route::get('/homepage-services', [AdminDashboardController::class, 'getHomepageServices']);
        Route::put('/homepage-services/{id}', [AdminDashboardController::class, 'updateHomepageService']);
        Route::put('/homepage-services-settings', [AdminDashboardController::class, 'updateHomepageServicesSettings']);

        Route::get('/email-templates', [AdminDashboardController::class, 'getEmailTemplates']);
        Route::get('/email-templates/{id}', [AdminDashboardController::class, 'getEmailTemplate']);
        Route::put('/email-templates/{id}', [AdminDashboardController::class, 'updateEmailTemplate']);
        Route::post('/email-templates/{id}/test', [AdminDashboardController::class, 'testEmailTemplate']);

        Route::get('/sms-templates', [AdminDashboardController::class, 'getSMSTemplates']);
        Route::get('/sms-templates/{id}', [AdminDashboardController::class, 'getSMSTemplate']);
        Route::put('/sms-templates/{id}', [AdminDashboardController::class, 'updateSMSTemplate']);
        Route::post('/sms-templates/{id}/test', [AdminDashboardController::class, 'testSMSTemplate']);

        Route::get('/termii-settings', [AdminDashboardController::class, 'getTermiiSettings']);
        Route::put('/termii-settings', [AdminDashboardController::class, 'updateTermiiSettings']);
        Route::get('/termii-balance', [AdminDashboardController::class, 'getTermiiBalance']);
        Route::get('/sms-log', [AdminDashboardController::class, 'getSMSLog']);

        Route::get('/services', [AdminDashboardController::class, 'getServices']);
        Route::get('/services/{id}', [AdminDashboardController::class, 'getService']);
        Route::post('/services', [AdminDashboardController::class, 'createService']);
        Route::put('/services/{id}', [AdminDashboardController::class, 'updateService']);
        Route::delete('/services/{id}', [AdminDashboardController::class, 'deleteService']);

        // Shipping configuration
        Route::get('/shipping-types', [ShippingConfigController::class, 'getShippingTypes']);
        Route::post('/shipping-types', [ShippingConfigController::class, 'createShippingType']);
        Route::put('/shipping-types/{id}', [ShippingConfigController::class, 'updateShippingType']);
        Route::delete('/shipping-types/{id}', [ShippingConfigController::class, 'deleteShippingType']);

        Route::get('/shipping-lines', [ShippingConfigController::class, 'getShippingLines']);
        Route::post('/shipping-lines', [ShippingConfigController::class, 'createShippingLine']);
        Route::put('/shipping-lines/{id}', [ShippingConfigController::class, 'updateShippingLine']);
        Route::delete('/shipping-lines/{id}', [ShippingConfigController::class, 'deleteShippingLine']);

        // Import/Export
        Route::post('/shipments/import', [ShipmentImportExportController::class, 'importExcel']);
        Route::get('/shipments/export', [ShipmentImportExportController::class, 'exportExcel']);

        // Image Upload
        Route::post('/upload/vehicle-image', [ImageUploadController::class, 'uploadVehicleImage']);
        Route::delete('/upload/vehicle-image', [ImageUploadController::class, 'deleteVehicleImage']);

        // Dock Receipts
        Route::post('/shipments/{shipmentId}/dock-receipt/preview', [DockReceiptController::class, 'previewReceipt']);
        Route::post('/shipments/{shipmentId}/dock-receipt', [DockReceiptController::class, 'generateReceipt']);
        Route::get('/dock-receipts/{receiptId}/download', [DockReceiptController::class, 'downloadReceipt']);
        Route::get('/shipments/{shipmentId}/dock-receipts', [DockReceiptController::class, 'getShipmentReceipts']);

        // Analytics
        Route::get('/analytics', [AdminDashboardController::class, 'getAnalytics']);

        // Admin User Management (Superadmin only)
        Route::get('/admin-users', [AdminDashboardController::class, 'getAdminUsers']);
        Route::post('/admin-users', [AdminDashboardController::class, 'createAdminUser']);
        Route::put('/admin-users/{id}', [AdminDashboardController::class, 'updateAdminUser']);
        Route::delete('/admin-users/{id}', [AdminDashboardController::class, 'deleteAdminUser']);
    });

    Route::get('/health', function () {
        return response()->json(['status' => 'ok']);
    });

    // Deployment endpoints (protected by token)
    Route::post('/deploy/migrate', [DeploymentController::class, 'runMigrations']);
    Route::post('/deploy/cache-clear', [DeploymentController::class, 'clearCache']);
    Route::get('/deploy/status', [DeploymentController::class, 'status']);
});
