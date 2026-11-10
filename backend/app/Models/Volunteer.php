<?php

namespace App\Models;

use App\Enums\VolunteerStatus;
use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\ExposesObjectId;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Módulo 03 — Voluntários.
 *
 * Cadastro próprio do sistema de escalas. Pode referenciar um membro de
 * outro sistema via external_ref, sem depender dele para funcionar.
 */
class Volunteer extends Model
{
    use BelongsToOrganization;
    use ExposesObjectId;
    use SoftDeletes;

    protected $connection = 'mongodb';
    protected $collection = 'volunteers';

    protected $fillable = [
        'organization_id',
        'name',
        'email',
        'phone',
        'birth_date',
        'gender',
        'photo_url',
        'status',
        'joined_at',
        'notes',
        'external_ref',
        'memberships',
        'skills',
        'preferences',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'joined_at' => 'date',
        'status' => VolunteerStatus::class,
    ];

    protected $attributes = [
        'status' => 'active',
    ];

    /**
     * memberships: [{ ministry_id, function_ids: [], is_leader, since }]
     * skills:      [{ skill_id, level, certified_at, expires_at, evaluated_by }]
     * preferences: { max_per_month, min_rest_days, preferred_weekdays: [], blackout_dates: [] }
     * external_ref:{ source, id, synced_at }
     */
    public function user()
    {
        return $this->hasOne(User::class);
    }

    public function assignments()
    {
        return $this->hasMany(Assignment::class);
    }

    public function ministryIds(): array
    {
        return collect($this->memberships ?? [])
            ->pluck('ministry_id')
            ->filter()
            ->map(fn ($id) => (string) $id)
            ->unique()
            ->values()
            ->all();
    }

    public function functionIdsFor(string $ministryId): array
    {
        return collect($this->memberships ?? [])
            ->firstWhere('ministry_id', $ministryId)['function_ids'] ?? [];
    }

    public function skillIds(): array
    {
        return collect($this->skills ?? [])
            ->pluck('skill_id')
            ->filter()
            ->map(fn ($id) => (string) $id)
            ->all();
    }
}
