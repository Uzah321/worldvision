<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DistributionSite extends Model
{
    protected $fillable = [
        'name', 'code', 'ward_id', 'district_id', 'project_id',
        'address', 'latitude', 'longitude', 'capacity', 'is_active',
    ];
    protected $casts = ['is_active' => 'boolean'];
    public function ward()        { return $this->belongsTo(Ward::class); }
    public function district()    { return $this->belongsTo(District::class); }
    public function project()     { return $this->belongsTo(Project::class); }
    public function distributions(){ return $this->hasMany(Distribution::class); }
}
