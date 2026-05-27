<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Survey extends Model
{
    protected $fillable = [
        'title', 'description', 'project_id', 'type', 'start_date', 'end_date', 'status', 'created_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
    ];

    public function project()   { return $this->belongsTo(Project::class); }
    public function createdBy() { return $this->belongsTo(User::class, 'created_by'); }
    public function responses() { return $this->hasMany(SurveyResponse::class); }
}
