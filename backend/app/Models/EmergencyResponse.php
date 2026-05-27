<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmergencyResponse extends Model
{
    protected $fillable = [
        'response_number', 'title', 'description', 'type', 'district_id',
        'programme_id', 'status', 'severity', 'start_date', 'end_date',
        'affected_people', 'budget_allocated', 'coordinator_id',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
        'budget_allocated' => 'decimal:2',
    ];

    public function district()    { return $this->belongsTo(District::class); }
    public function programme()   { return $this->belongsTo(Programme::class); }
    public function coordinator() { return $this->belongsTo(User::class, 'coordinator_id'); }
}
