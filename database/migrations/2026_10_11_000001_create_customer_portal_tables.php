<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Tables whose records are linked to a portal customer through customer_id. */
    private array $linkedTables = [
        'quotes', 'shipments', 'procurements', 'autosales', 'truckings', 'clearances', 'auction_requests', 'invoices',
    ];

    public function up(): void
    {
        if (!Schema::hasTable('customers')) {
            Schema::create('customers', function (Blueprint $table) {
                $table->id();
                $table->string('company_name');
                $table->string('contact_name')->nullable();
                $table->string('email')->unique();
                $table->string('phone')->nullable();
                $table->text('address')->nullable();
                $table->enum('status', ['pending', 'active', 'suspended'])->default('pending');
                $table->enum('registered_via', ['self', 'admin'])->default('self');
                // Records are only auto-linked by email once an admin has confirmed the account.
                $table->boolean('link_verified')->default(false);
                $table->unsignedSmallInteger('credit_terms_days')->default(0);
                $table->decimal('credit_balance', 14, 2)->default(0);
                $table->string('pricing_tier')->default('standard');
                $table->decimal('discount_percent', 5, 2)->default(0);
                $table->decimal('approval_threshold', 14, 2)->nullable();
                $table->json('notification_prefs')->nullable();
                $table->string('api_token_hash', 64)->nullable()->index();
                $table->text('admin_notes')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('customer_users')) {
            Schema::create('customer_users', function (Blueprint $table) {
                $table->id();
                $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
                $table->string('name');
                $table->string('email')->unique();
                $table->string('phone')->nullable();
                $table->string('password');
                $table->enum('role', ['owner', 'finance', 'operations'])->default('operations');
                $table->boolean('is_active')->default(true);
                $table->timestamp('last_login_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('customer_password_resets')) {
            Schema::create('customer_password_resets', function (Blueprint $table) {
                $table->id();
                $table->string('email')->index();
                $table->string('token_hash', 64);
                $table->timestamp('expires_at');
                $table->timestamps();
            });
        }

        foreach ($this->linkedTables as $tableName) {
            if (Schema::hasTable($tableName) && !Schema::hasColumn($tableName, 'customer_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->unsignedBigInteger('customer_id')->nullable()->index();
                });
            }
        }

        if (Schema::hasTable('quotes')) {
            Schema::table('quotes', function (Blueprint $table) {
                if (!Schema::hasColumn('quotes', 'quoted_amount')) {
                    $table->decimal('quoted_amount', 14, 2)->nullable();
                }
                if (!Schema::hasColumn('quotes', 'quote_notes')) {
                    $table->text('quote_notes')->nullable();
                }
                if (!Schema::hasColumn('quotes', 'customer_response')) {
                    $table->string('customer_response', 20)->nullable();
                }
                if (!Schema::hasColumn('quotes', 'customer_responded_at')) {
                    $table->timestamp('customer_responded_at')->nullable();
                }
            });
        }

        if (Schema::hasTable('invoices')) {
            Schema::table('invoices', function (Blueprint $table) {
                if (!Schema::hasColumn('invoices', 'status')) {
                    $table->string('status', 20)->default('unpaid');
                }
                if (!Schema::hasColumn('invoices', 'amount_paid')) {
                    $table->decimal('amount_paid', 14, 2)->default(0);
                }
                if (!Schema::hasColumn('invoices', 'due_date')) {
                    $table->date('due_date')->nullable();
                }
            });
        }

        if (!Schema::hasTable('payments')) {
            Schema::create('payments', function (Blueprint $table) {
                $table->id();
                $table->string('receipt_number')->unique();
                $table->unsignedBigInteger('invoice_id')->index();
                $table->unsignedBigInteger('customer_id')->nullable()->index();
                $table->unsignedBigInteger('submitted_by')->nullable();
                $table->string('method', 40);
                $table->decimal('amount', 14, 2);
                $table->string('currency', 3)->default('NGN');
                $table->string('reference')->nullable();
                $table->string('proof_path')->nullable();
                $table->text('note')->nullable();
                $table->enum('status', ['pending', 'confirmed', 'rejected'])->default('pending');
                $table->string('reviewed_by')->nullable();
                $table->timestamp('reviewed_at')->nullable();
                $table->text('review_note')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('customer_credit_entries')) {
            Schema::create('customer_credit_entries', function (Blueprint $table) {
                $table->id();
                $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
                $table->decimal('amount', 14, 2); // positive = deposit, negative = applied to invoice
                $table->string('type', 20);
                $table->unsignedBigInteger('invoice_id')->nullable();
                $table->string('description')->nullable();
                $table->string('created_by')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('portal_requests')) {
            Schema::create('portal_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
                $table->unsignedBigInteger('requested_by');
                $table->unsignedBigInteger('decided_by')->nullable();
                $table->string('type', 30); // quote, auction, trucking, clearance, procurement
                $table->json('payload');
                $table->decimal('estimated_value', 14, 2)->nullable();
                $table->enum('status', ['awaiting_approval', 'submitted', 'declined'])->default('submitted');
                $table->string('linked_table', 40)->nullable();
                $table->unsignedBigInteger('linked_id')->nullable();
                $table->text('decision_note')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('customer_documents')) {
            Schema::create('customer_documents', function (Blueprint $table) {
                $table->id();
                $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
                $table->unsignedBigInteger('uploaded_by_user')->nullable();
                $table->string('uploaded_by_admin')->nullable();
                $table->string('record_type', 40)->nullable();
                $table->unsignedBigInteger('record_id')->nullable();
                $table->string('category', 40)->default('other');
                $table->string('title');
                $table->string('path');
                $table->string('mime', 100)->nullable();
                $table->unsignedBigInteger('size')->default(0);
                $table->boolean('visible_to_customer')->default(true);
                $table->timestamps();
                $table->index(['record_type', 'record_id']);
            });
        }

        if (!Schema::hasTable('support_tickets')) {
            Schema::create('support_tickets', function (Blueprint $table) {
                $table->id();
                $table->string('ticket_number')->unique();
                $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
                $table->unsignedBigInteger('opened_by');
                $table->string('record_type', 40)->nullable();
                $table->unsignedBigInteger('record_id')->nullable();
                $table->string('subject');
                $table->enum('status', ['open', 'answered', 'closed'])->default('open');
                $table->timestamp('last_message_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('support_ticket_messages')) {
            Schema::create('support_ticket_messages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('ticket_id')->constrained('support_tickets')->cascadeOnDelete();
                $table->enum('sender_type', ['customer', 'admin']);
                $table->string('sender_name');
                $table->text('body');
                $table->timestamps();
            });
        }

        $defaults = [
            'portal_enabled' => '1',
            'portal_registration_mode' => 'approval', // open | approval | admin_only
            'portal_bank_details' => '',
            'portal_default_currency' => 'NGN',
            'portal_requestable_services' => json_encode(['quote', 'auction', 'trucking', 'clearance']),
            'portal_tiers' => json_encode([
                ['key' => 'standard', 'label' => 'Standard', 'discount_percent' => 0],
                ['key' => 'silver', 'label' => 'Silver', 'discount_percent' => 3],
                ['key' => 'gold', 'label' => 'Gold', 'discount_percent' => 5],
                ['key' => 'platinum', 'label' => 'Platinum', 'discount_percent' => 8],
            ]),
            // Gateway methods are listed so the client can choose them, but stay unavailable until integrated.
            'portal_payment_methods' => json_encode([
                ['key' => 'paystack', 'label' => 'Paystack', 'kind' => 'gateway', 'enabled' => false],
                ['key' => 'flutterwave', 'label' => 'Flutterwave', 'kind' => 'gateway', 'enabled' => false],
                ['key' => 'virtual_account', 'label' => 'Automatic bank transfer (virtual account)', 'kind' => 'gateway', 'enabled' => false],
                ['key' => 'remita', 'label' => 'Remita', 'kind' => 'gateway', 'enabled' => false],
                ['key' => 'stripe', 'label' => 'Stripe', 'kind' => 'gateway', 'enabled' => false],
                ['key' => 'paypal', 'label' => 'PayPal', 'kind' => 'gateway', 'enabled' => false],
                ['key' => 'bank_transfer', 'label' => 'Bank transfer', 'kind' => 'manual', 'enabled' => true, 'instructions' => ''],
                ['key' => 'swift_wire', 'label' => 'International wire (SWIFT)', 'kind' => 'manual', 'enabled' => false, 'instructions' => ''],
                ['key' => 'usdt', 'label' => 'Cryptocurrency (USDT)', 'kind' => 'manual', 'enabled' => false, 'instructions' => ''],
                ['key' => 'cash_pos', 'label' => 'Cash or POS at office', 'kind' => 'manual', 'enabled' => false, 'instructions' => ''],
                ['key' => 'account_credit', 'label' => 'Account credit / deposit', 'kind' => 'credit', 'enabled' => true],
                ['key' => 'credit_terms', 'label' => 'Pay on credit terms', 'kind' => 'terms', 'enabled' => true],
            ]),
        ];

        foreach ($defaults as $key => $value) {
            if (!DB::table('settings')->where('key', $key)->exists()) {
                DB::table('settings')->insert(['key' => $key, 'value' => $value, 'created_at' => now(), 'updated_at' => now()]);
            }
        }

        $this->seedNotificationTemplates();
    }

    public function down(): void
    {
        foreach (['support_ticket_messages', 'support_tickets', 'customer_documents', 'portal_requests', 'customer_credit_entries', 'payments'] as $tableName) {
            Schema::dropIfExists($tableName);
        }

        if (Schema::hasTable('invoices')) {
            Schema::table('invoices', function (Blueprint $table) {
                foreach (['status', 'amount_paid', 'due_date'] as $column) {
                    if (Schema::hasColumn('invoices', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        if (Schema::hasTable('quotes')) {
            Schema::table('quotes', function (Blueprint $table) {
                foreach (['quoted_amount', 'quote_notes', 'customer_response', 'customer_responded_at'] as $column) {
                    if (Schema::hasColumn('quotes', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        foreach ($this->linkedTables as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'customer_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropColumn('customer_id');
                });
            }
        }

        Schema::dropIfExists('customer_password_resets');
        Schema::dropIfExists('customer_users');
        Schema::dropIfExists('customers');

        DB::table('settings')->whereIn('key', [
            'portal_enabled', 'portal_registration_mode', 'portal_bank_details', 'portal_default_currency',
            'portal_requestable_services', 'portal_tiers', 'portal_payment_methods',
        ])->delete();
        DB::table('email_templates')->where('slug', 'portal-notice')->delete();
        DB::table('sms_templates')->where('slug', 'portal-notice')->delete();
    }

    private function seedNotificationTemplates(): void
    {
        if (Schema::hasTable('email_templates') && !DB::table('email_templates')->where('slug', 'portal-notice')->exists()) {
            $row = [
                'name' => 'Portal Notice',
                'slug' => 'portal-notice',
                'subject' => '{{subject}}',
                'content' => '<h1>{{subject}}</h1><p>Hello {{customer_name}},</p><p>{{message}}</p>',
                'type' => 'general',
                'variables' => json_encode(['customer_name', 'subject', 'message', 'portal_url']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ];
            DB::table('email_templates')->insert($row);
        }

        if (Schema::hasTable('sms_templates') && !DB::table('sms_templates')->where('slug', 'portal-notice')->exists()) {
            DB::table('sms_templates')->insert([
                'name' => 'Portal Notice',
                'slug' => 'portal-notice',
                'message' => 'OD Automotive: {{message}}',
                'type' => 'general',
                'variables' => json_encode(['message']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
};
