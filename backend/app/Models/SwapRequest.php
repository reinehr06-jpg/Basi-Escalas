<?php

namespace App\Models;

use App\Enums\SwapStatus;
use App\Enums\SwapType;
use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\ExposesObjectId;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/** Módulo 09 — Trocas e substituições. */
class SwapRequest extends Model
{
    use BelongsToOrganization;
    use ExposesObjectId;
    use SoftDeletes;

    protected $connection = 'mongodb';
    protected $collection = 'swap_requests';

    protected $fillable = [
        'organization_id',
        'assignment_id',
        'event_id',
        'ministry_id',
        'requester_volunteer_id',
        'target_volunteer_id',
        'target_assignment_id',
        'type',
        'status',
        'reason',
        'responses',
        'accepted_volunteer_id',
        'accepted_at',
        'reviewed_by',
        'reviewed_at',
        'review_note',
        'expires_at',
    ];

    protected $casts = [
        'accepted_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'expires_at' => 'datetime',
        'type' => SwapType::class,
        'status' => SwapStatus::class,
    ];

    protected $attributes = [
        'status' => 'open',
        'type' => 'replacement',
    ];

    /** responses: [{ volunteer_id, answer, at }] — quem se ofereceu ou recusou. */
    public function assignment()
    {
        return $this->belongsTo(Assignment::class);
    }

    public function requester()
    {
        return $this->belongsTo(Volunteer::class, 'requester_volunteer_id');
    }
}
