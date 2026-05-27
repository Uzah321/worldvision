<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    protected $fillable = [
        'name', 'code', 'district_id', 'address', 'latitude', 'longitude',
        'capacity_cbm', 'managed_by', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];

    public function district()   { return $this->belongsTo(District::class); }
    public function manager()    { return $this->belongsTo(User::class, 'managed_by'); }
    public function inventory()  { return $this->hasMany(Inventory::class); }
    public function movements()  { return $this->hasMany(InventoryMovement::class); }
    public function distributions(){ return $this->hasMany(Distribution::class); }
}
