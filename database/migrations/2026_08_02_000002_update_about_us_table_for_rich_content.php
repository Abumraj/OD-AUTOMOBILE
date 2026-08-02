<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Check and add columns if they don't exist
        if (!Schema::hasColumn('about_us', 'subtitle')) {
            Schema::table('about_us', function (Blueprint $table) {
                $table->string('subtitle')->nullable()->after('title');
            });
        }

        if (!Schema::hasColumn('about_us', 'image_url')) {
            Schema::table('about_us', function (Blueprint $table) {
                $table->text('image_url')->nullable()->after('content');
            });
        } else {
            // Modify existing column to TEXT type
            DB::statement('ALTER TABLE about_us MODIFY image_url TEXT NULL');
        }

        if (!Schema::hasColumn('about_us', 'metadata')) {
            Schema::table('about_us', function (Blueprint $table) {
                $table->json('metadata')->nullable()->after('image_url');
            });
        }

        // Clear existing data and insert new structured sections
        DB::table('about_us')->truncate();

        DB::table('about_us')->insert([
            [
                'section_key' => 'hero',
                'title' => 'Our Story: Precision in Motion',
                'subtitle' => 'EST. 2015',
                'content' => 'From regional car transport to a global logistics powerhouse, OD Automotive & Logistics has redefined industrial precision through innovative tracking and unwavering reliability.',
                'image_url' => 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6FQ4Z3cRqcsXQI0t9qbpn2-ZwXE0gklAgtZsBJAwxWbX9wIgjJYAlgTrRenKLyMm7hT7NZxQpjs7wSpF_GeqQfOjw_7MZQy4AOzpgrJpfhUfK0JpbVsJE8Ux1iY5gVkzMip4wPVAKSOcDhhvZUS6hPvmu97mDCpVt5leS8d-LeuSEpsv92740DzdQa5qd1_WgBSWCdmp1Mnpc0x7Xj59LXbge2b1JIVoMDBXYG6NdFa0rH3hW2AozEA',
                'metadata' => json_encode(['stat_value' => '450+', 'stat_label' => 'Logistics Experts']),
                'display_order' => 1,
                'is_published' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'section_key' => 'mission',
                'title' => 'Our Mission',
                'subtitle' => 'CORE PURPOSE',
                'content' => 'To engineer the world\'s most transparent and reliable automotive logistics infrastructure, ensuring every vehicle—from vintage collectors to industrial fleets—reaches its destination with mathematical precision and absolute care.',
                'image_url' => null,
                'metadata' => json_encode(['icon' => 'rocket_launch']),
                'display_order' => 2,
                'is_published' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'section_key' => 'vision',
                'title' => 'Our Vision',
                'subtitle' => null,
                'content' => 'To become the digital backbone of global vehicle commerce, where boundaries vanish and logistics becomes a seamless extension of our clients\' success.',
                'image_url' => null,
                'metadata' => json_encode(['icon' => 'visibility']),
                'display_order' => 3,
                'is_published' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'section_key' => 'leader_1',
                'title' => 'Sarah Jenkins',
                'subtitle' => 'Chief Operations Officer',
                'content' => 'With over 20 years in maritime and land logistics, Sarah directs our complex global supply chain operations.',
                'image_url' => 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAwcTq78uQoNNgQFwyL7nEaCq6Pm_e2PXqZ5pumi2Zh5xGuFC2LJQ6Y-97K-pNV9sm7vI23hvuZrOF0dSFasBCtIKgBnTn1vhs9_5FiQIlWqw6Ytgb7u3dC-hAb_X0JJ5qnY6n-e3HiBVjdlq8THoorJaj-GdCg70LPK9yxpTMNj5ptkFe3cqKB-p7a_qPrR2uxlLG9rRrIwb8gXalnIDKTG8JXv6mYndLw4fnANH57fivebDGFwIIBA',
                'metadata' => json_encode(['type' => 'leader']),
                'display_order' => 4,
                'is_published' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'section_key' => 'leader_2',
                'title' => 'Marcus Chen',
                'subtitle' => 'Director of Global Logistics',
                'content' => 'Marcus leads our international auction integration and strategic shipping partnerships across four continents.',
                'image_url' => 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFXNQE3DIYbCusff_fi5dzvOvWHwraVmpBdmYgil48OHsV7SpQFIxUeaum1oINh1L4Z1eH8lsHEKNV3PCSuYl_CJ1MdVI57KwWY40J_nhKwcHeyQemto0NdGeIM5UU8x7YAtz6pmsty08ADL1jo-HygDZu_uDKwe3vLB8CWO_6G-0I_jFVbNjbhcJ2qpaNYD5w09M7EEVAqqRBb-vq3QXRaTqldE42ukSf_wBy2Y6CFn-xqjvkNbBPow',
                'metadata' => json_encode(['type' => 'leader']),
                'display_order' => 5,
                'is_published' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'section_key' => 'timeline_2015',
                'title' => 'Founding',
                'subtitle' => '2015',
                'content' => 'OD Automotive launched with a 5-truck fleet and a mission to digitize the shipping process.',
                'image_url' => null,
                'metadata' => json_encode(['type' => 'timeline', 'highlight' => true]),
                'display_order' => 6,
                'is_published' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'section_key' => 'timeline_2018',
                'title' => 'Global Hubs',
                'subtitle' => '2018',
                'content' => 'Opening of our primary international logistics hubs in Berlin and Singapore.',
                'image_url' => null,
                'metadata' => json_encode(['type' => 'timeline', 'highlight' => false]),
                'display_order' => 7,
                'is_published' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'section_key' => 'timeline_2021',
                'title' => 'Auction Portal',
                'subtitle' => '2021',
                'content' => 'Launch of the real-time automotive auction portal and tracking integration platform.',
                'image_url' => null,
                'metadata' => json_encode(['type' => 'timeline', 'highlight' => false]),
                'display_order' => 8,
                'is_published' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'section_key' => 'timeline_2024',
                'title' => 'Net Zero Initiative',
                'subtitle' => '2024',
                'content' => 'Pioneering green shipping routes and 100% paperless tracking workflows worldwide.',
                'image_url' => null,
                'metadata' => json_encode(['type' => 'timeline', 'highlight' => true]),
                'display_order' => 9,
                'is_published' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);
    }

    public function down(): void
    {
        Schema::table('about_us', function (Blueprint $table) {
            $table->dropColumn(['subtitle', 'image_url', 'metadata']);
        });
    }
};
