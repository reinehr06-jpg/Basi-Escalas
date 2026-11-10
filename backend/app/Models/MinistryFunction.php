<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\ExposesObjectId;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/** Módulo 02 — Funções exercidas dentro de um ministério. */
class MinistryFunction extends Model
{
    use BelongsToOrganization;
    use ExposesObjectId;
    use SoftDeletes;

    protected $connection = 'mongodb';
    protected $collection = 'functions';

    protected $fillable = [
        'organization_id',
        'ministry_id',
        'name',
        'description',
        'color',
        'required_skill_ids',
        'default_quantity',
        'min_quantity',
        'max_quantity',
        'is_leadership',
        'order',
        'status',
    ];

    protected $casts = [
        'default_quantity' => 'integer',
        'min_quantity' => 'integer',
        'max_quantity' => 'integer',
        'is_leadership' => 'boolean',
        'order' => 'integer',
    ];

    protected $attributes = [
        'status' => 'active',
        'default_quantity' => 1,
        'min_quantity' => 1,
        'is_leadership' => false,
        'order' => 0,
    ];

    public function ministry()
    {
        return $this->belongsTo(Ministry::class);
    }
}
