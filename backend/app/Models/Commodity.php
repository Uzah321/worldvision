<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Commodity extends Model
{
    protected $fillable = [
        'category_id', 'name', 'code', 'description', 'unit_of_measure',
        'unit_weight_kg', 'unit_ration_per_person', 'monthly_ration_per_person',
        'unit_cost', 'currency', 'requires_refrigeration', 'is_active',
    ];

    protected $casts = [
        'requires_refrigeration'   => 'boolean',
        'is_active'                => 'boolean',
        'unit_weight_kg'           => 'decimal:4',
        'unit_ration_per_person'   => 'decimal:4',
        'monthly_ration_per_person'=> 'decimal:4',
        'unit_cost'                => 'decimal:2',
    ];

    public function category()  { return $this->belongsTo(CommodityCategory::class); }
    public function inventory() { return $this->hasMany(Inventory::class); }

    public function calculateRation(int $householdSize, int $months = 1): float
    {
        return $this->monthly_ration_per_person * $householdSize * $months;
    }
}
