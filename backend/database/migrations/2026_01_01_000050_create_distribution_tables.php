<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('distributions', function (Blueprint $table) {
            $table->id();
            $table->string('distribution_number')->unique();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('programme_id')->constrained()->cascadeOnDelete();
            $table->foreignId('distribution_site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->date('distribution_date');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->enum('status', ['draft', 'approved', 'in_progress', 'completed', 'cancelled'])->default('draft');
            $table->enum('mode', ['standard', 'emergency'])->default('standard');
            $table->integer('planned_beneficiaries')->default(0);
            $table->integer('actual_beneficiaries')->default(0);
            $table->integer('planned_households')->default(0);
            $table->integer('actual_households')->default(0);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['project_id', 'status']);
            $table->index('distribution_date');
        });

        Schema::create('distribution_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('distribution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('commodity_id')->constrained()->cascadeOnDelete();
            $table->foreignId('inventory_id')->constrained('inventory')->cascadeOnDelete();
            $table->decimal('planned_quantity', 18, 4)->default(0);
            $table->decimal('actual_quantity', 18, 4)->default(0);
            $table->decimal('unit_ration', 10, 4)->default(0);
            $table->string('unit_of_measure')->default('kg');
            $table->timestamps();
        });

        Schema::create('distribution_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('distribution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('beneficiary_id')->constrained()->cascadeOnDelete();
            $table->foreignId('household_id')->constrained()->cascadeOnDelete();
            $table->timestamp('collected_at');
            $table->enum('verification_method', ['qr_code', 'fingerprint', 'manual', 'photo_id'])->default('manual');
            $table->boolean('is_verified')->default(false);
            $table->boolean('collected_by_proxy')->default(false);
            $table->string('proxy_name')->nullable();
            $table->string('proxy_id')->nullable();
            $table->string('proxy_relationship')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->boolean('is_flagged')->default(false);
            $table->string('flag_reason')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('rations_received')->nullable()->comment('JSON of commodity: quantity pairs');
            $table->timestamps();

            $table->unique(['distribution_id', 'beneficiary_id']);
            $table->index(['distribution_id', 'household_id']);
            $table->index(['beneficiary_id', 'collected_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('distribution_records');
        Schema::dropIfExists('distribution_items');
        Schema::dropIfExists('distributions');
    }
};
