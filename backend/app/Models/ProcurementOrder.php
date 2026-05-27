<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProcurementOrder extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'po_number', 'programme_id', 'project_id', 'supplier_id', 'warehouse_id',
        'title', 'description', 'total_amount', 'currency', 'required_date',
        'delivery_date', 'status', 'priority', 'created_by', 'approved_by',
        'approved_at', 'rejection_reason',
    ];

    protected $casts = [
        'required_date' => 'date',
        'delivery_date' => 'date',
        'approved_at'   => 'datetime',
        'total_amount'  => 'decimal:2',
    ];

    public function programme()  { return $this->belongsTo(Programme::class); }
    public function project()    { return $this->belongsTo(Project::class); }
    public function supplier()   { return $this->belongsTo(Supplier::class); }
    public function warehouse()  { return $this->belongsTo(Warehouse::class); }
    public function createdBy()  { return $this->belongsTo(User::class, 'created_by'); }
    public function approvedBy() { return $this->belongsTo(User::class, 'approved_by'); }
    public function items()      { return $this->hasMany(ProcurementItem::class); }
}
