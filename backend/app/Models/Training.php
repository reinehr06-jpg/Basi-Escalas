<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\ExposesObjectId;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/** Módulo 13 — Capacitações / treinamentos. */
class Training extends Model
{
    use BelongsToOrganization;
    use ExposesObjectId;
    use SoftDeletes;

    protected $connection = 'mongodb';
    protected $collection = 'trainings';

    protected $fillable = [
        'organization_id',
        'ministry_id',
        'name',
        'description',
        'skill_ids',
        'starts_at',
        'ends_at',
        'location',
        'instructor',
        'capacity',
        'participants',
        'status',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'capacity' => 'integer',
    ];

    protected $attributes = [
        'status' => 'scheduled',
    ];

    /** participants: [{ volunteer_id, status, score, completed_at }] */
    public function ministry()
    {
        return $this->belongsTo(Ministry::class);
    }
}
