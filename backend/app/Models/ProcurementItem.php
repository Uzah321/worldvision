<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProcurementItem extends Model
{
    protected $fillable = [
        'procurement_order_id', 'commodity_id', 'quantity_ordered',
        'quantity_received', 'unit_price', 'total_price', 'unit_of_measure',
    ];

    public function order()     { return $this->belongsTo(ProcurementOrder::class, 'procurement_order_id'); }
    public function commodity() { return $this->belongsTo(Commodity::class); }
}
