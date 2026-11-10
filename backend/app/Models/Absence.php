<?php

namespace App\Models;

use App\Enums\AbsenceStatus;
use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\ExposesObjectId;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/** Módulo 07 — Ausências e afastamentos por período. */
class Absence extends Model
{
    use BelongsToOrganization;
    use ExposesObjectId;
    use SoftDeletes;

    protected $connection = 'mongodb';
    protected $collection = 'absences';

    protected $fillable = [
        'organization_id',
        'volunteer_id',
        'starts_at',
        'ends_at',
        'reason',
        'type',
        'status',
        'reviewed_by',
        'reviewed_at',
        'review_note',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'status' => AbsenceStatus::class,
    ];

    protected $attributes = [
        'status' => 'pending',
        'type' => 'personal',
    ];

    public function volunteer()
    {
        return $this->belongsTo(Volunteer::class);
    }

    public function scopeApprovedCovering($query, $date)
    {
        return $query->where('status', AbsenceStatus::Approved->value)
            ->where('starts_at', '<=', $date)
            ->where('ends_at', '>=', $date);
    }
}
