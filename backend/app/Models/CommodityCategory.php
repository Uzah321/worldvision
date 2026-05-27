<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CommodityCategory extends Model
{
    protected $fillable = ['name', 'code', 'description', 'type'];
    public function commodities() { return $this->hasMany(Commodity::class, 'category_id'); }
}
