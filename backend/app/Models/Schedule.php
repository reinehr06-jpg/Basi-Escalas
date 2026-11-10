<?php

namespace App\Models;

use App\Enums\ScheduleStatus;
use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\ExposesObjectId;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Módulo 05 — Escalas.
 *
 * Uma escala é o conjunto de vagas de UM ministério em UM evento.
 * As vagas preenchidas viram documentos em `assignments`, que é onde
 * confirmações, trocas e presenças acontecem.
 */
class Schedule extends Model
{
    use BelongsToOrganization;
    use ExposesObjectId;
    use SoftDeletes;

    protected $connection = 'mongodb';
    protected $collection = 'schedules';

    protected $fillable = [
        'organization_id',
        'event_id',
        'ministry_id',
        'name',
        'notes',
        'status',
        'slots',
        'confirmation_deadline_at',
        'published_at',
        'published_by',
        'closed_at',
    ];

    protected $casts = [
        'confirmation_deadline_at' => 'datetime',
        'published_at' => 'datetime',
        'closed_at' => 'datetime',
        'status' => ScheduleStatus::class,
    ];

    protected $attributes = [
        'status' => 'draft',
    ];

    /** slots: [{ function_id, needed }] — a necessidade declarada por função. */
    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function ministry()
    {
        return $this->belongsTo(Ministry::class);
    }

    public function assignments()
    {
        return $this->hasMany(Assignment::class);
    }

    public function isEditable(): bool
    {
        return in_array($this->status, [ScheduleStatus::Draft, ScheduleStatus::Published], true);
    }

    public function neededTotal(): int
    {
        return collect($this->slots ?? [])->sum(fn ($slot) => (int) ($slot['needed'] ?? 0));
    }
}
