<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ward extends Model
{
    protected $fillable = ['district_id', 'name', 'code', 'latitude', 'longitude', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];
    public function district()    { return $this->belongsTo(District::class); }
    public function households()  { return $this->hasMany(Household::class); }
}
