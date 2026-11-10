<?php

namespace App\Models;

use App\Enums\AssignmentStatus;
use App\Enums\AttendanceStatus;
use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\ExposesObjectId;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * A designação de um voluntário para uma função em um evento.
 * Concentra os módulos 08 (confirmações) e 10 (presenças/check-in).
 */
class Assignment extends Model
{
    use BelongsToOrganization;
    use ExposesObjectId;
    use SoftDeletes;

    protected $connection = 'mongodb';
    protected $collection = 'assignments';

    protected $fillable = [
        'organization_id',
        'schedule_id',
        'event_id',
        'ministry_id',
        'function_id',
        'volunteer_id',
        'starts_at',
        'status',
        'notes',
        'assigned_by',
        'assigned_at',
        'confirmed_at',
        'declined_at',
        'decline_reason',
        'attendance_status',
        'checked_in_at',
        'checked_in_by',
        'checkin_method',
        'attendance_note',
        'replaced_assignment_id',
        'swap_request_id',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'assigned_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'declined_at' => 'datetime',
        'checked_in_at' => 'datetime',
        'status' => AssignmentStatus::class,
        'attendance_status' => AttendanceStatus::class,
    ];

    protected $attributes = [
        'status' => 'pending',
        'attendance_status' => 'pending',
    ];

    public function schedule()
    {
        return $this->belongsTo(Schedule::class);
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function volunteer()
    {
        return $this->belongsTo(Volunteer::class);
    }

    public function ministry()
    {
        return $this->belongsTo(Ministry::class);
    }

    public function function()
    {
        return $this->belongsTo(MinistryFunction::class, 'function_id');
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', [
            AssignmentStatus::Pending->value,
            AssignmentStatus::Confirmed->value,
        ]);
    }
}
