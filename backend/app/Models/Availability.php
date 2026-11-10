<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\ExposesObjectId;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Módulo 07 — Disponibilidade recorrente do voluntário.
 * Ausências pontuais ficam em App\Models\Absence.
 */
class Availability extends Model
{
    use BelongsToOrganization;
    use ExposesObjectId;
    use SoftDeletes;

    protected $connection = 'mongodb';
    protected $collection = 'availabilities';

    protected $fillable = [
        'organization_id',
        'volunteer_id',
        'weekday',
        'start_time',
        'end_time',
        'is_available',
        'ministry_id',
        'note',
    ];

    protected $casts = [
        'weekday' => 'integer',
        'is_available' => 'boolean',
    ];

    protected $attributes = [
        'is_available' => true,
    ];

    /** weekday: 0 (domingo) a 6 (sábado); start_time/end_time em "HH:mm". */
    public function volunteer()
    {
        return $this->belongsTo(Volunteer::class);
    }
}
