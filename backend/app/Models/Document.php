<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title', 'file_path', 'file_name', 'file_type', 'file_size',
        'document_type', 'documentable_type', 'documentable_id',
        'description', 'uploaded_by',
    ];

    public function documentable() { return $this->morphTo(); }
    public function uploadedBy()   { return $this->belongsTo(User::class, 'uploaded_by'); }
}
