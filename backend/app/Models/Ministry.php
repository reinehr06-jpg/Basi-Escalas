<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\ExposesObjectId;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/** Módulo 01 — Ministérios. */
class Ministry extends Model
{
    use BelongsToOrganization;
    use ExposesObjectId;
    use SoftDeletes;

    protected $connection = 'mongodb';
    protected $collection = 'ministries';

    protected $fillable = [
        'organization_id',
        'name',
        'description',
        'color',
        'icon',
        'leader_ids',
        'status',
        'settings',
    ];


    protected $attributes = [
        'status' => 'active',
        'color' => '#6D28D9',
    ];

    /**
     * settings aceita:
     *  - confirmation_deadline_hours: prazo para o voluntário confirmar
     *  - min_rest_days: folga mínima entre escalas
     *  - max_per_month: teto de escalas por voluntário
     *  - auto_publish: publicar escala ao criar
     */
    public function functions()
    {
        return $this->hasMany(MinistryFunction::class);
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    public function leaders()
    {
        return Volunteer::whereIn('_id', $this->leader_ids ?? [])->get();
    }
}
