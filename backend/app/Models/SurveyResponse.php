<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SurveyResponse extends Model
{
    protected $fillable = [
        'survey_id', 'beneficiary_id', 'household_id', 'responses',
        'latitude', 'longitude', 'submitted_by',
    ];

    protected $casts = ['responses' => 'array'];

    public function survey()      { return $this->belongsTo(Survey::class); }
    public function beneficiary() { return $this->belongsTo(Beneficiary::class); }
    public function household()   { return $this->belongsTo(Household::class); }
    public function submittedBy() { return $this->belongsTo(User::class, 'submitted_by'); }
}
