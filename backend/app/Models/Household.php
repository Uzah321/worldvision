<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Household extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'household_number', 'head_name', 'head_national_id', 'head_phone',
        'head_gender', 'head_dob', 'total_members', 'male_members', 'female_members',
        'children_under5', 'children_5_17', 'elderly_60plus', 'disabled_members',
        'pregnant_lactating', 'vulnerability_score', 'address', 'latitude', 'longitude',
        'ward_id', 'district_id', 'status', 'notes', 'photo_path', 'registered_by',
    ];

    protected $casts = [
        'head_dob'            => 'date',
        'vulnerability_score' => 'decimal:2',
        'latitude'            => 'decimal:7',
        'longitude'           => 'decimal:7',
    ];

    public function district()    { return $this->belongsTo(District::class); }
    public function ward()        { return $this->belongsTo(Ward::class); }
    public function registeredBy(){ return $this->belongsTo(User::class, 'registered_by'); }

    public function beneficiaries()
    {
        return $this->hasMany(Beneficiary::class);
    }

    public function head()
    {
        return $this->hasOne(Beneficiary::class)->where('is_household_head', true);
    }

    public function distributionRecords()
    {
        return $this->hasMany(DistributionRecord::class);
    }

    public function calculateVulnerabilityScore(): float
    {
        $score = 0;
        if ($this->female_members > $this->male_members) $score += 10;
        if ($this->children_under5 > 0) $score += ($this->children_under5 * 5);
        if ($this->elderly_60plus > 0) $score += ($this->elderly_60plus * 5);
        if ($this->disabled_members > 0) $score += ($this->disabled_members * 8);
        if ($this->pregnant_lactating > 0) $score += ($this->pregnant_lactating * 7);
        return min(100, $score);
    }
}
