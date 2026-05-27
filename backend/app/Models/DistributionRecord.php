<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DistributionRecord extends Model
{
    protected $fillable = [
        'distribution_id', 'beneficiary_id', 'household_id', 'collected_at',
        'verification_method', 'is_verified', 'collected_by_proxy', 'proxy_name',
        'proxy_id', 'proxy_relationship', 'latitude', 'longitude', 'is_flagged',
        'flag_reason', 'recorded_by', 'rations_received',
    ];

    protected $casts = [
        'collected_at'       => 'datetime',
        'is_verified'        => 'boolean',
        'collected_by_proxy' => 'boolean',
        'is_flagged'         => 'boolean',
        'rations_received'   => 'array',
    ];

    public function distribution() { return $this->belongsTo(Distribution::class); }
    public function beneficiary()  { return $this->belongsTo(Beneficiary::class); }
    public function household()    { return $this->belongsTo(Household::class); }
    public function recordedBy()   { return $this->belongsTo(User::class, 'recorded_by'); }
}
