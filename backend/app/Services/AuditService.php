<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuditService
{
    /**
     * Log an audit event.
     *
     * @param  string       $event          e.g. 'login', 'beneficiary_registered'
     * @param  string|null  $auditableType  Model class name without namespace, e.g. 'Beneficiary'
     * @param  int|null     $auditableId
     * @param  array|null   $newValues      Data being stored / changed
     * @param  Request|null $request        Current HTTP request for IP / UA info
     * @param  array|null   $oldValues      Previous state for update events
     */
    public function log(
        string $event,
        ?string $auditableType = null,
        ?int $auditableId = null,
        ?array $newValues = null,
        ?Request $request = null,
        ?array $oldValues = null
    ): AuditLog {
        $userId = Auth::id();

        return AuditLog::create([
            'user_id'        => $userId,
            'event'          => $event,
            'auditable_type' => $auditableType ? "App\\Models\\{$auditableType}" : null,
            'auditable_id'   => $auditableId,
            'old_values'     => $oldValues,
            'new_values'     => $newValues,
            'url'            => $request?->fullUrl(),
            'ip_address'     => $request?->ip(),
            'user_agent'     => $request?->userAgent(),
            'module'         => $this->resolveModule($event),
        ]);
    }

    private function resolveModule(string $event): string
    {
        return match (true) {
            str_contains($event, 'login') || str_contains($event, 'logout') || str_contains($event, 'password') => 'auth',
            str_contains($event, 'beneficiary') || str_contains($event, 'household') => 'beneficiaries',
            str_contains($event, 'distribution') || str_contains($event, 'record') => 'distribution',
            str_contains($event, 'inventory') || str_contains($event, 'warehouse') => 'inventory',
            str_contains($event, 'procurement') || str_contains($event, 'supplier') => 'procurement',
            str_contains($event, 'user') || str_contains($event, 'role') || str_contains($event, 'permission') => 'users',
            str_contains($event, 'programme') || str_contains($event, 'project') => 'programmes',
            default => 'general',
        };
    }
}
