<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Distribution extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'distribution_number', 'project_id', 'programme_id', 'distribution_site_id',
        'warehouse_id', 'name', 'distribution_date', 'start_time', 'end_time',
        'status', 'mode', 'planned_beneficiaries', 'actual_beneficiaries',
        'planned_households', 'actual_households', 'notes', 'created_by',
        'approved_by', 'approved_at', 'latitude', 'longitude',
    ];

    protected $casts = [
        'distribution_date' => 'date',
        'approved_at'       => 'datetime',
    ];

    public function project()         { return $this->belongsTo(Project::class); }
    public function programme()       { return $this->belongsTo(Programme::class); }
    public function site()            { return $this->belongsTo(DistributionSite::class, 'distribution_site_id'); }
    public function warehouse()       { return $this->belongsTo(Warehouse::class); }
    public function createdBy()       { return $this->belongsTo(User::class, 'created_by'); }
    public function approvedBy()      { return $this->belongsTo(User::class, 'approved_by'); }
    public function items()           { return $this->hasMany(DistributionItem::class); }
    public function records()         { return $this->hasMany(DistributionRecord::class); }
    public function fraudAlerts()     { return $this->hasMany(FraudAlert::class); }
}
