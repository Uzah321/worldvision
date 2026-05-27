<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DistributionItem extends Model
{
    protected $fillable = [
        'distribution_id', 'commodity_id', 'inventory_id',
        'planned_quantity', 'actual_quantity', 'unit_ration', 'unit_of_measure',
    ];

    public function distribution() { return $this->belongsTo(Distribution::class); }
    public function commodity()    { return $this->belongsTo(Commodity::class); }
    public function inventory()    { return $this->belongsTo(Inventory::class); }
}
