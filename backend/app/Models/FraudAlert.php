<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FraudAlert extends Model
{
    protected $fillable = [
        'distribution_id', 'beneficiary_id', 'user_id', 'alert_type',
        'description', 'severity', 'status', 'evidence', 'latitude', 'longitude',
        'investigated_by', 'investigation_notes', 'resolved_at',
    ];

    protected $casts = [
        'evidence'    => 'array',
        'resolved_at' => 'datetime',
    ];

    public function distribution()   { return $this->belongsTo(Distribution::class); }
    public function beneficiary()    { return $this->belongsTo(Beneficiary::class); }
    public function investigatedBy() { return $this->belongsTo(User::class, 'investigated_by'); }
}
