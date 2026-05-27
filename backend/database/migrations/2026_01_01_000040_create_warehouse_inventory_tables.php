<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warehouses', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->foreignId('district_id')->nullable()->constrained()->nullOnDelete();
            $table->text('address')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->decimal('capacity_cbm', 10, 2)->default(0)->comment('Capacity in cubic meters');
            $table->foreignId('managed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('commodity_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->enum('type', ['food', 'non_food', 'medical', 'shelter', 'wash', 'other'])->default('food');
            $table->timestamps();
        });

        Schema::create('commodities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('commodity_categories')->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->string('unit_of_measure')->default('kg');
            $table->decimal('unit_weight_kg', 10, 4)->default(0);
            $table->decimal('unit_ration_per_person', 10, 4)->default(0)->comment('Default ration per person per distribution');
            $table->decimal('monthly_ration_per_person', 10, 4)->default(0)->comment('Monthly ration per person');
            $table->decimal('unit_cost', 18, 2)->default(0);
            $table->string('currency', 10)->default('USD');
            $table->boolean('requires_refrigeration')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('inventory', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->constrained()->cascadeOnDelete();
            $table->foreignId('commodity_id')->constrained()->cascadeOnDelete();
            $table->string('batch_number')->nullable();
            $table->string('lot_number')->nullable();
            $table->date('manufacture_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->decimal('quantity_received', 18, 4)->default(0);
            $table->decimal('quantity_available', 18, 4)->default(0);
            $table->decimal('quantity_reserved', 18, 4)->default(0);
            $table->decimal('quantity_distributed', 18, 4)->default(0);
            $table->decimal('quantity_damaged', 18, 4)->default(0);
            $table->decimal('quantity_expired', 18, 4)->default(0);
            $table->decimal('quantity_lost', 18, 4)->default(0);
            $table->decimal('reorder_level', 18, 4)->default(0);
            $table->enum('status', ['good', 'near_expiry', 'expired', 'damaged'])->default('good');
            $table->foreignId('programme_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index(['warehouse_id', 'commodity_id']);
            $table->index('expiry_date');
        });

        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_id')->constrained('inventory')->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained()->cascadeOnDelete();
            $table->foreignId('commodity_id')->constrained()->cascadeOnDelete();
            $table->enum('movement_type', ['receipt', 'dispatch', 'transfer_in', 'transfer_out', 'adjustment', 'loss', 'damage', 'return']);
            $table->decimal('quantity', 18, 4);
            $table->decimal('balance_after', 18, 4);
            $table->string('reference_number')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
        Schema::dropIfExists('inventory');
        Schema::dropIfExists('commodities');
        Schema::dropIfExists('commodity_categories');
        Schema::dropIfExists('warehouses');
    }
};
