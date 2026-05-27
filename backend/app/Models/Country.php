<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Country extends Model
{
    protected $fillable = ['name', 'code', 'currency', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];
    public function regions() { return $this->hasMany(Region::class); }
    public function programmes() { return $this->hasMany(Programme::class); }
}
