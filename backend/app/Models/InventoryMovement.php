<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryMovement extends Model
{
    protected $fillable = [
        'inventory_id', 'warehouse_id', 'commodity_id', 'movement_type', 'quantity',
        'balance_after', 'reference_number', 'notes', 'latitude', 'longitude', 'performed_by',
    ];

    public function inventory()   { return $this->belongsTo(Inventory::class); }
    public function warehouse()   { return $this->belongsTo(Warehouse::class); }
    public function commodity()   { return $this->belongsTo(Commodity::class); }
    public function performedBy() { return $this->belongsTo(User::class, 'performed_by'); }
}
