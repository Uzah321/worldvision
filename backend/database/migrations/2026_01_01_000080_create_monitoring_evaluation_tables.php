<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surveys', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['baseline', 'midterm', 'endline', 'post_distribution', 'needs_assessment', 'other'])->default('other');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->enum('status', ['draft', 'active', 'closed'])->default('draft');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('survey_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_id')->constrained()->cascadeOnDelete();
            $table->foreignId('beneficiary_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('household_id')->nullable()->constrained()->nullOnDelete();
            $table->json('responses');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('kpi_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('indicator_name');
            $table->string('unit')->default('%');
            $table->decimal('baseline_value', 18, 4)->default(0);
            $table->decimal('target_value', 18, 4)->default(0);
            $table->decimal('current_value', 18, 4)->default(0);
            $table->date('target_date')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('employee_id')->nullable()->after('id');
            $table->string('phone')->nullable()->after('email');
            $table->string('avatar')->nullable()->after('phone');
            $table->foreignId('district_id')->nullable()->after('avatar')->constrained()->nullOnDelete();
            $table->boolean('is_active')->default(true)->after('district_id');
            $table->string('job_title')->nullable()->after('is_active');
            $table->timestamp('last_login_at')->nullable()->after('job_title');
            $table->softDeletes()->after('updated_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kpi_targets');
        Schema::dropIfExists('survey_responses');
        Schema::dropIfExists('surveys');
    }
};
