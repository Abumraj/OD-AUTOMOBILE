<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update the enum to include all status values
        DB::statement("ALTER TABLE `auction_requests` MODIFY COLUMN `status` ENUM('pending', 'searching', 'found', 'bidding', 'won', 'lost', 'completed', 'cancelled', 'declined') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original enum values
        DB::statement("ALTER TABLE `auction_requests` MODIFY COLUMN `status` ENUM('pending', 'searching', 'found', 'won', 'declined') DEFAULT 'pending'");
    }
};
