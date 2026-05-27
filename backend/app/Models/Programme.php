<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Programme extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name', 'code', 'description', 'donor', 'start_date', 'end_date',
        'budget', 'currency', 'status', 'country_id', 'created_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
        'budget'     => 'decimal:2',
    ];

    public function country()      { return $this->belongsTo(Country::class); }
    public function createdBy()    { return $this->belongsTo(User::class, 'created_by'); }
    public function projects()     { return $this->hasMany(Project::class); }
    public function beneficiaries(){ return $this->belongsToMany(Beneficiary::class, 'beneficiary_programme'); }
    public function distributions(){ return $this->hasMany(Distribution::class); }
    public function inventory()    { return $this->hasMany(Inventory::class); }
}
