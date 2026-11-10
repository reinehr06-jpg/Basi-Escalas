<?php

namespace App\Models;

use App\Enums\EventStatus;
use App\Enums\EventType;
use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\ExposesObjectId;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Módulo 04 — Calendário.
 *
 * Cada documento é uma ocorrência concreta (culto, ensaio, evento).
 * Séries recorrentes são materializadas em ocorrências ligadas por series_id,
 * o que mantém consultas por intervalo baratas no Mongo.
 */
class Event extends Model
{
    use BelongsToOrganization;
    use ExposesObjectId;
    use SoftDeletes;

    protected $connection = 'mongodb';
    protected $collection = 'events';

    protected $fillable = [
        'organization_id',
        'series_id',
        'title',
        'description',
        'type',
        'starts_at',
        'ends_at',
        'all_day',
        'location',
        'ministry_ids',
        'recurrence',
        'status',
        'cancellation_reason',
        'color',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'all_day' => 'boolean',
        'type' => EventType::class,
        'status' => EventStatus::class,
    ];

    protected $attributes = [
        'status' => 'planned',
        'type' => 'service',
        'all_day' => false,
    ];

    /** recurrence: { frequency: weekly|monthly, interval, weekdays: [], until } */
    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    public function scopeBetween($query, $start, $end)
    {
        return $query->where('starts_at', '>=', $start)->where('starts_at', '<=', $end);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('starts_at', '>=', now())->orderBy('starts_at');
    }
}
