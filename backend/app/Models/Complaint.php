<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Complaint extends Model
{
    protected $fillable = [
        'complaint_number', 'complainant_name', 'complainant_phone', 'category',
        'description', 'status', 'severity', 'project_id', 'assigned_to',
        'resolution_notes', 'resolved_at', 'latitude', 'longitude', 'is_anonymous',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
        'is_anonymous'=> 'boolean',
    ];

    public function project()    { return $this->belongsTo(Project::class); }
    public function assignedTo() { return $this->belongsTo(User::class, 'assigned_to'); }
}
