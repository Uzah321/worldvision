<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Region extends Model
{
    protected $fillable = ['country_id', 'name', 'code', 'latitude', 'longitude', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];
    public function country()   { return $this->belongsTo(Country::class); }
    public function districts() { return $this->hasMany(District::class); }
}
