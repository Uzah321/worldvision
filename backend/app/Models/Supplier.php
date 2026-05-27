<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name', 'code', 'contact_person', 'phone', 'email',
        'address', 'tax_number', 'bank_account', 'status', 'notes',
    ];

    public function procurementOrders() { return $this->hasMany(ProcurementOrder::class); }
}
