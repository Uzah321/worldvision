<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('programmes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->string('donor')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('budget', 18, 2)->default(0);
            $table->string('currency', 10)->default('USD');
            $table->enum('status', ['planning', 'active', 'suspended', 'closed'])->default('planning');
            $table->foreignId('country_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('programme_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('budget', 18, 2)->default(0);
            $table->enum('status', ['planning', 'active', 'suspended', 'closed'])->default('planning');
            $table->foreignId('region_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('district_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('distribution_sites', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->foreignId('ward_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('district_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->text('address')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->integer('capacity')->default(0)->comment('Max beneficiaries per day');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('distribution_sites');
        Schema::dropIfExists('projects');
        Schema::dropIfExists('programmes');
    }
};
