<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    protected $table = 'inventory';

    protected $fillable = [
        'warehouse_id', 'commodity_id', 'batch_number', 'lot_number',
        'manufacture_date', 'expiry_date', 'quantity_received', 'quantity_available',
        'quantity_reserved', 'quantity_distributed', 'quantity_damaged',
        'quantity_expired', 'quantity_lost', 'reorder_level', 'status', 'programme_id',
    ];

    protected $casts = [
        'manufacture_date' => 'date',
        'expiry_date'      => 'date',
    ];

    public function warehouse()  { return $this->belongsTo(Warehouse::class); }
    public function commodity()  { return $this->belongsTo(Commodity::class); }
    public function programme()  { return $this->belongsTo(Programme::class); }
    public function movements()  { return $this->hasMany(InventoryMovement::class); }

    public function isNearExpiry(int $days = 30): bool
    {
        return $this->expiry_date && $this->expiry_date->diffInDays(now()) <= $days;
    }

    public function isBelowReorderLevel(): bool
    {
        return $this->quantity_available <= $this->reorder_level;
    }
}
