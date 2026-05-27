<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Beneficiary extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'beneficiary_number', 'household_id', 'first_name', 'last_name',
        'national_id', 'date_of_birth', 'gender', 'phone', 'email',
        'is_household_head', 'relationship_to_head', 'is_disabled', 'disability_type',
        'is_pregnant', 'is_lactating', 'is_malnourished', 'muac_measurement',
        'photo_path', 'fingerprint_hash', 'qr_code', 'status', 'notes',
        'registered_by', 'registered_at',
    ];

    protected $casts = [
        'date_of_birth'     => 'date',
        'registered_at'     => 'datetime',
        'is_household_head' => 'boolean',
        'is_disabled'       => 'boolean',
        'is_pregnant'       => 'boolean',
        'is_lactating'      => 'boolean',
        'is_malnourished'   => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($beneficiary) {
            if (empty($beneficiary->qr_code)) {
                $beneficiary->qr_code = strtoupper(Str::random(12));
            }
        });
    }

    public function household()       { return $this->belongsTo(Household::class); }
    public function registeredBy()    { return $this->belongsTo(User::class, 'registered_by'); }
    public function programmes()      { return $this->belongsToMany(Programme::class, 'beneficiary_programme')->withPivot('project_id', 'enrollment_date', 'exit_date', 'status'); }
    public function distributionRecords() { return $this->hasMany(DistributionRecord::class); }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function getAgeAttribute(): ?int
    {
        return $this->date_of_birth ? $this->date_of_birth->age : null;
    }
}
