<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event');
            $table->string('auditable_type')->nullable();
            $table->unsignedBigInteger('auditable_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('url')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('module')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['auditable_type', 'auditable_id']);
            $table->index(['user_id', 'event']);
            $table->index('created_at');
        });

        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('file_path');
            $table->string('file_name');
            $table->string('file_type')->nullable();
            $table->unsignedBigInteger('file_size')->default(0);
            $table->enum('document_type', ['contract', 'waybill', 'delivery_note', 'beneficiary_form', 'audit_doc', 'donor_report', 'id_document', 'other']);
            $table->morphs('documentable');
            $table->text('description')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('complaints', function (Blueprint $table) {
            $table->id();
            $table->string('complaint_number')->unique();
            $table->string('complainant_name')->nullable();
            $table->string('complainant_phone')->nullable();
            $table->enum('category', ['distribution', 'staff_conduct', 'fraud', 'targeting', 'quality', 'other']);
            $table->text('description');
            $table->enum('status', ['received', 'under_investigation', 'resolved', 'closed', 'escalated'])->default('received');
            $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->text('resolution_notes')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->boolean('is_anonymous')->default(false);
            $table->timestamps();
        });

        Schema::create('fraud_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('distribution_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('beneficiary_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('alert_type', [
                'duplicate_collection', 'gps_mismatch', 'multiple_attempts',
                'proxy_fraud', 'unusual_stock_movement', 'suspicious_registration',
                'ai_anomaly', 'manual_flag'
            ]);
            $table->text('description');
            $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->enum('status', ['open', 'investigating', 'confirmed', 'dismissed'])->default('open');
            $table->json('evidence')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->foreignId('investigated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('investigation_notes')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });

        Schema::create('emergency_responses', function (Blueprint $table) {
            $table->id();
            $table->string('response_number')->unique();
            $table->string('title');
            $table->text('description');
            $table->enum('type', ['flood', 'drought', 'conflict', 'disease_outbreak', 'earthquake', 'other']);
            $table->foreignId('district_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('programme_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('status', ['declared', 'active', 'winding_down', 'closed'])->default('declared');
            $table->enum('severity', ['low', 'medium', 'high', 'catastrophic'])->default('medium');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->integer('affected_people')->default(0);
            $table->decimal('budget_allocated', 18, 2)->default(0);
            $table->foreignId('coordinator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('emergency_responses');
        Schema::dropIfExists('fraud_alerts');
        Schema::dropIfExists('complaints');
        Schema::dropIfExists('documents');
        Schema::dropIfExists('audit_logs');
    }
};
