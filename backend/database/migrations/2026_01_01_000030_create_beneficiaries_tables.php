<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('households', function (Blueprint $table) {
            $table->id();
            $table->string('household_number')->unique();
            $table->string('head_name');
            $table->string('head_national_id')->nullable();
            $table->string('head_phone')->nullable();
            $table->enum('head_gender', ['male', 'female', 'other'])->default('male');
            $table->date('head_dob')->nullable();
            $table->integer('total_members')->default(1);
            $table->integer('male_members')->default(0);
            $table->integer('female_members')->default(0);
            $table->integer('children_under5')->default(0);
            $table->integer('children_5_17')->default(0);
            $table->integer('elderly_60plus')->default(0);
            $table->integer('disabled_members')->default(0);
            $table->integer('pregnant_lactating')->default(0);
            $table->decimal('vulnerability_score', 5, 2)->default(0.00);
            $table->text('address')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->foreignId('ward_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('district_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('status', ['active', 'graduated', 'suspended', 'deceased'])->default('active');
            $table->text('notes')->nullable();
            $table->string('photo_path')->nullable();
            $table->foreignId('registered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['district_id', 'status']);
            $table->index('household_number');
        });

        Schema::create('beneficiaries', function (Blueprint $table) {
            $table->id();
            $table->string('beneficiary_number')->unique();
            $table->foreignId('household_id')->constrained()->cascadeOnDelete();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('national_id')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->default('male');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->boolean('is_household_head')->default(false);
            $table->string('relationship_to_head')->nullable();
            $table->boolean('is_disabled')->default(false);
            $table->string('disability_type')->nullable();
            $table->boolean('is_pregnant')->default(false);
            $table->boolean('is_lactating')->default(false);
            $table->boolean('is_malnourished')->default(false);
            $table->string('muac_measurement')->nullable()->comment('Mid-Upper Arm Circumference in mm');
            $table->string('photo_path')->nullable();
            $table->string('fingerprint_hash')->nullable();
            $table->string('qr_code')->nullable()->unique();
            $table->enum('status', ['active', 'graduated', 'suspended', 'deceased', 'transferred'])->default('active');
            $table->text('notes')->nullable();
            $table->foreignId('registered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('registered_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['household_id', 'status']);
            $table->index('national_id');
        });

        Schema::create('beneficiary_programme', function (Blueprint $table) {
            $table->id();
            $table->foreignId('beneficiary_id')->constrained()->cascadeOnDelete();
            $table->foreignId('programme_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->date('enrollment_date');
            $table->date('exit_date')->nullable();
            $table->string('exit_reason')->nullable();
            $table->enum('status', ['active', 'graduated', 'exited'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('beneficiary_programme');
        Schema::dropIfExists('beneficiaries');
        Schema::dropIfExists('households');
    }
};
