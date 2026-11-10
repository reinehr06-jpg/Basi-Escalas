<?php

namespace App\Http\Controllers\Api;

use App\Enums\AssignmentStatus;
use App\Models\Assignment;
use App\Models\Event;
use App\Models\Ministry;
use App\Models\MinistryFunction;
use App\Models\Schedule;
use App\Models\SwapRequest;
use App\Models\Volunteer;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/** Módulo 14 — Relatórios e indicadores. */
class ReportController extends ApiController
{
    /** Engajamento por voluntário: quanto foi chamado, confirmou e apareceu. */
    public function volunteers(Request $request): JsonResponse
    {
        [$from, $to] = $this->period($request);

        $assignments = $this->scopedAssignments($request, $from, $to);
        $volunteers = Volunteer::all()->keyBy(fn ($v) => (string) $v->getKey());

        $rows = $assignments->groupBy(fn (Assignment $a) => (string) $a->volunteer_id)
            ->map(function (Collection $group, string $volunteerId) use ($volunteers) {
                $total = $group->count();
                $confirmed = $group->filter(fn ($a) => $a->status?->value === 'confirmed')->count();
                $declined = $group->filter(fn ($a) => $a->status?->value === 'declined')->count();
                $present = $group->filter(fn ($a) => $a->attendance_status?->value === 'present')->count();
                $absent = $group->filter(fn ($a) => $a->attendance_status?->value === 'absent')->count();
                $checked = $present + $absent;

                return [
                    'volunteer_id' => $volunteerId,
                    'name' => $volunteers[$volunteerId]->name ?? 'Voluntário removido',
                    'photo_url' => $volunteers[$volunteerId]->photo_url ?? null,
                    'scheduled' => $total,
                    'confirmed' => $confirmed,
                    'declined' => $declined,
                    'present' => $present,
                    'absent' => $absent,
                    'confirmation_rate' => $total > 0 ? (int) round($confirmed / $total * 100) : 0,
                    'attendance_rate' => $checked > 0 ? (int) round($present / $checked * 100) : 0,
                    'last_served_at' => $group->filter(fn ($a) => $a->attendance_status?->value === 'present')
                        ->sortByDesc('starts_at')->first()?->starts_at?->toIso8601String(),
                ];
            })
            ->sortByDesc('scheduled')
            ->values();

        return response()->json([
            'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'data' => $rows,
            'totals' => [
                'volunteers' => $rows->count(),
                'scheduled' => $rows->sum('scheduled'),
                'present' => $rows->sum('present'),
                'never_served' => Volunteer::where('status', 'active')->count() - $rows->count(),
            ],
        ]);
    }

    /** Cobertura e saúde de cada ministério. */
    public function ministries(Request $request): JsonResponse
    {
        [$from, $to] = $this->period($request);

        $eventIds = $this->eventIds($from, $to);
        $schedules = Schedule::whereIn('event_id', $eventIds)->get();
        $assignments = Assignment::whereIn('event_id', $eventIds)->get();

        $rows = Ministry::where('status', 'active')->get()->map(function (Ministry $ministry) use ($schedules, $assignments) {
            $id = (string) $ministry->getKey();
            $mySchedules = $schedules->where('ministry_id', $id);
            $myAssignments = $assignments->where('ministry_id', $id);

            $needed = $mySchedules->sum(fn (Schedule $s) => $s->neededTotal());
            $filled = $myAssignments->filter(fn ($a) => in_array($a->status?->value, ['pending', 'confirmed'], true))->count();
            $present = $myAssignments->filter(fn ($a) => $a->attendance_status?->value === 'present')->count();
            $absent = $myAssignments->filter(fn ($a) => $a->attendance_status?->value === 'absent')->count();

            return [
                'ministry_id' => $id,
                'name' => $ministry->name,
                'color' => $ministry->color,
                'volunteers' => Volunteer::where('memberships.ministry_id', $id)->where('status', 'active')->count(),
                'functions' => MinistryFunction::where('ministry_id', $id)->where('status', 'active')->count(),
                'schedules' => $mySchedules->count(),
                'needed' => $needed,
                'filled' => $filled,
                'missing' => max(0, $needed - $filled),
                'coverage_rate' => $needed > 0 ? (int) round($filled / $needed * 100) : 100,
                'confirmed' => $myAssignments->filter(fn ($a) => $a->status?->value === 'confirmed')->count(),
                'declined' => $myAssignments->filter(fn ($a) => $a->status?->value === 'declined')->count(),
                'present' => $present,
                'absent' => $absent,
                'attendance_rate' => ($present + $absent) > 0 ? (int) round($present / ($present + $absent) * 100) : 0,
            ];
        })->sortBy('coverage_rate')->values();

        return response()->json([
            'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'data' => $rows,
        ]);
    }

    /** Presença evento a evento. */
    public function attendance(Request $request): JsonResponse
    {
        [$from, $to] = $this->period($request);

        $events = Event::whereBetween('starts_at', [$from, $to])
            ->where('status', '!=', 'cancelled')
            ->orderBy('starts_at')
            ->get();

        $assignments = Assignment::whereIn('event_id', $events->map(fn (Event $event) => (string) $event->getKey())->all())->get();

        $rows = $events->map(function (Event $event) use ($assignments) {
            $mine = $assignments->where('event_id', (string) $event->getKey());
            $present = $mine->filter(fn ($a) => $a->attendance_status?->value === 'present')->count();
            $absent = $mine->filter(fn ($a) => $a->attendance_status?->value === 'absent')->count();
            $late = $mine->filter(fn ($a) => $a->attendance_status?->value === 'late')->count();

            return [
                'event_id' => (string) $event->getKey(),
                'title' => $event->title,
                'type' => $event->type?->value,
                'starts_at' => $event->starts_at?->toIso8601String(),
                'scheduled' => $mine->count(),
                'confirmed' => $mine->filter(fn ($a) => $a->status?->value === 'confirmed')->count(),
                'present' => $present,
                'late' => $late,
                'absent' => $absent,
                'attendance_rate' => ($present + $absent) > 0 ? (int) round($present / ($present + $absent) * 100) : null,
            ];
        })->values();

        return response()->json([
            'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'data' => $rows,
        ]);
    }

    /** Volume e desfecho das trocas — mede o atrito da operação. */
    public function swaps(Request $request): JsonResponse
    {
        [$from, $to] = $this->period($request);

        $swaps = SwapRequest::whereBetween('created_at', [$from, $to])->get();
        $volunteers = Volunteer::all()->keyBy(fn ($v) => (string) $v->getKey());
        $ministries = Ministry::all()->keyBy(fn ($m) => (string) $m->getKey());

        return response()->json([
            'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'totals' => [
                'total' => $swaps->count(),
                'open' => $swaps->filter(fn ($s) => $s->status?->value === 'open')->count(),
                'approved' => $swaps->filter(fn ($s) => $s->status?->value === 'approved')->count(),
                'rejected' => $swaps->filter(fn ($s) => $s->status?->value === 'rejected')->count(),
                'cancelled' => $swaps->filter(fn ($s) => $s->status?->value === 'cancelled')->count(),
            ],
            'by_ministry' => $swaps->groupBy(fn ($s) => (string) $s->ministry_id)
                ->map(fn ($group, $id) => [
                    'ministry_id' => $id,
                    'name' => $ministries[$id]->name ?? '—',
                    'total' => $group->count(),
                ])->sortByDesc('total')->values(),
            'top_requesters' => $swaps->groupBy(fn ($s) => (string) $s->requester_volunteer_id)
                ->map(fn ($group, $id) => [
                    'volunteer_id' => $id,
                    'name' => $volunteers[$id]->name ?? '—',
                    'total' => $group->count(),
                ])->sortByDesc('total')->take(10)->values(),
        ]);
    }

    private function period(Request $request): array
    {
        return [
            CarbonImmutable::parse($request->input('from', now()->startOfMonth()))->startOfDay(),
            CarbonImmutable::parse($request->input('to', now()->endOfMonth()))->endOfDay(),
        ];
    }

    private function eventIds(CarbonImmutable $from, CarbonImmutable $to): array
    {
        return Event::whereBetween('starts_at', [$from, $to])
            ->where('status', '!=', 'cancelled')
            ->get()->map(fn ($model) => (string) $model->getKey())->all();
    }

    private function scopedAssignments(Request $request, CarbonImmutable $from, CarbonImmutable $to): Collection
    {
        $query = Assignment::whereBetween('starts_at', [$from, $to]);

        if ($ministryId = $request->input('ministry_id')) {
            $query->where('ministry_id', $ministryId);
        }

        return $query->get();
    }
}
