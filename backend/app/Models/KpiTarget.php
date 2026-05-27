<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KpiTarget extends Model
{
    protected $fillable = [
        'project_id', 'indicator_name', 'unit', 'baseline_value',
        'target_value', 'current_value', 'target_date', 'description',
    ];

    protected $casts = [
        'target_date'    => 'date',
        'baseline_value' => 'decimal:4',
        'target_value'   => 'decimal:4',
        'current_value'  => 'decimal:4',
    ];

    public function project() { return $this->belongsTo(Project::class); }

    public function getProgressPercentageAttribute(): float
    {
        if ($this->target_value == 0) return 0;
        return min(100, ($this->current_value / $this->target_value) * 100);
    }
}
