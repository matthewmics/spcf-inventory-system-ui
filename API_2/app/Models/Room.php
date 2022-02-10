<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Building;

class Room extends Model
{
    use SoftDeletes;
    use HasFactory;

    public $fillable = [
        "name",
        "room_type",
        "building_id"
    ];

    public function building()
    {
        return $this->belongsTo(Building::class);
    }
}