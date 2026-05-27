<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class District extends Model
{
    protected $fillable = ['region_id', 'name', 'code', 'latitude', 'longitude', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];
    public function region()     { return $this->belongsTo(Region::class); }
    public function wards()      { return $this->hasMany(Ward::class); }
    public function households() { return $this->hasMany(Household::class); }
    public function warehouses() { return $this->hasMany(Warehouse::class); }
}
