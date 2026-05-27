<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'programme_id', 'name', 'code', 'description', 'start_date', 'end_date',
        'budget', 'status', 'region_id', 'district_id', 'created_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
        'budget'     => 'decimal:2',
    ];

    public function programme()     { return $this->belongsTo(Programme::class); }
    public function region()        { return $this->belongsTo(Region::class); }
    public function district()      { return $this->belongsTo(District::class); }
    public function createdBy()     { return $this->belongsTo(User::class, 'created_by'); }
    public function distributions() { return $this->hasMany(Distribution::class); }
    public function kpiTargets()    { return $this->hasMany(KpiTarget::class); }
    public function surveys()       { return $this->hasMany(Survey::class); }
    public function distributionSites() { return $this->hasMany(DistributionSite::class); }
}
