<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            QuoteSeeder::class,
            ShipmentSeeder::class,
            AuctionSeeder::class,
            TestimonialSeeder::class,
            ContactMessageSeeder::class,
            ActivitySeeder::class,
            CarrierSeeder::class,
        ]);
    }
}
