<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shipments', function (Blueprint $table) {
            $table->string('car_model')->nullable();
            $table->string('year')->nullable();
            $table->string('car_color')->nullable();
            $table->text('image_link')->nullable();
            $table->string('vin')->nullable();
            $table->foreignId('shipping_type_id')->nullable()->constrained('shipping_types')->onDelete('set null');
            $table->foreignId('shipping_line_id')->nullable()->constrained('shipping_lines')->onDelete('set null');
            $table->date('eta')->nullable();
            $table->string('client_name')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('shipments', function (Blueprint $table) {
            $table->dropForeign(['shipping_type_id']);
            $table->dropForeign(['shipping_line_id']);
            $table->dropColumn([
                'car_model',
                'year',
                'car_color',
                'image_link',
                'vin',
                'shipping_type_id',
                'shipping_line_id',
                'eta',
                'client_name'
            ]);
        });
    }
};
