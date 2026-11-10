<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\ExposesObjectId;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/** Módulo 13 — Habilidades. */
class Skill extends Model
{
    use BelongsToOrganization;
    use ExposesObjectId;
    use SoftDeletes;

    protected $connection = 'mongodb';
    protected $collection = 'skills';

    protected $fillable = [
        'organization_id',
        'ministry_id',
        'name',
        'description',
        'category',
        'levels',
        'requires_certification',
        'validity_months',
        'status',
    ];

    protected $casts = [
        'requires_certification' => 'boolean',
        'validity_months' => 'integer',
    ];

    protected $attributes = [
        'status' => 'active',
        'requires_certification' => false,
    ];

    public function ministry()
    {
        return $this->belongsTo(Ministry::class);
    }
}
