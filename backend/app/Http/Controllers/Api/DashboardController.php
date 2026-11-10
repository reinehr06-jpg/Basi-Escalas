<?php

namespace App\Http\Controllers\Api;

use App\Enums\AssignmentStatus;
use App\Enums\ScheduleStatus;
use App\Models\Absence;
use App\Models\Assignment;
use App\Models\Event;
use App\Models\Ministry;
use App\Models\Schedule;
use App\Models\SwapRequest;
use App\Models\Volunteer;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Módulo 06 — Dashboard da coordenação. */
class DashboardController extends ApiController
{
    public function summary(Request $request): JsonResponse
    {
        $from = CarbonImmutable::parse($request->input('from', now()->startOfMonth()));
        $to = CarbonImmutable::parse($request->input('to', now()->endOfMonth()));

        $eventIds = Event::whereBetween('starts_at', [$from, $to])
            ->where('status', '!=', 'cancelled')
            ->get()->map(fn ($model) => (string) $model->getKey())->all();

        $assignments = Assignment::whereIn('event_id', $eventIds)->get();
        $schedules = Schedule::whereIn('event_id', $eventIds)->get();

        $needed = $schedules->sum(fn (Schedule $s) => $s->neededTotal());
        $filled = $assignments->filter(fn ($a) => in_array($a->status?->value, ['pending', 'confirmed'], true))->count();
        $confirmed = $assignments->filter(fn ($a) => $a->status?->value === 'confirmed')->count();
        $declined = $assignments->filter(fn ($a) => $a->status?->value === 'declined')->count();
        $present = $assignments->filter(fn ($a) => $a->attendance_status?->value === 'present')->count();
        $absent = $assignments->filter(fn ($a) => $a->attendance_status?->value === 'absent')->count();
        $checked = $present + $absent;

        return response()->json([
            'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'cards' => [
                'events' => count($eventIds),
                'schedules' => $schedules->count(),
                'drafts' => $schedules->filter(fn ($s) => $s->status?->value === 'draft')->count(),
                'volunteers_active' => Volunteer::where('status', 'active')->count(),
                'ministries' => Ministry::where('status', 'active')->count(),
                'open_swaps' => SwapRequest::where('status', 'open')->count(),
                'pending_absences' => Absence::where('status', 'pending')->count(),
            ],
            'coverage' => [
                'needed' => $needed,
                'filled' => $filled,
                'missing' => max(0, $needed - $filled),
                'rate' => $needed > 0 ? (int) round($filled / $needed * 100) : 100,
            ],
            'confirmation' => [
                'confirmed' => $confirmed,
                'pending' => $assignments->filter(fn ($a) => $a->status?->value === 'pending')->count(),
                'declined' => $declined,
                'rate' => $filled > 0 ? (int) round($confirmed / $filled * 100) : 0,
            ],
            'attendance' => [
                'present' => $present,
                'absent' => $absent,
                'rate' => $checked > 0 ? (int) round($present / $checked * 100) : 0,
            ],
            'by_ministry' => $this->byMinistry($schedules, $assignments),
            'upcoming' => $this->upcoming(),
            'attention' => $this->attention(),
        ]);
    }

    private function byMinistry($schedules, $assignments): array
    {
        $ministries = Ministry::where('status', 'active')->get()->keyBy(fn ($m) => (string) $m->getKey());

        return $schedules->groupBy(fn (Schedule $s) => (string) $s->ministry_id)
            ->map(function ($group, $ministryId) use ($assignments, $ministries) {
                $needed = $group->sum(fn (Schedule $s) => $s->neededTotal());
                $mine = $assignments->where('ministry_id', $ministryId);
                $filled = $mine->filter(fn ($a) => in_array($a->status?->value, ['pending', 'confirmed'], true))->count();

                return [
                    'ministry_id' => $ministryId,
                    'name' => $ministries[$ministryId]->name ?? 'Ministério removido',
                    'color' => $ministries[$ministryId]->color ?? '#6D28D9',
                    'schedules' => $group->count(),
                    'needed' => $needed,
                    'filled' => $filled,
                    'missing' => max(0, $needed - $filled),
                    'confirmed' => $mine->filter(fn ($a) => $a->status?->value === 'confirmed')->count(),
                    'rate' => $needed > 0 ? (int) round($filled / $needed * 100) : 100,
                ];
            })
            ->sortBy('rate')
            ->values()
            ->all();
    }

    private function upcoming(): array
    {
        return Event::upcoming()->limit(8)->get()->map(function (Event $event) {
            $schedules = Schedule::where('event_id', (string) $event->getKey())->get();
            $needed = $schedules->sum(fn (Schedule $s) => $s->neededTotal());
            $filled = Assignment::where('event_id', (string) $event->getKey())->active()->count();

            return [
                'id' => (string) $event->getKey(),
                'title' => $event->title,
                'type' => $event->type?->value,
                'starts_at' => $event->starts_at?->toIso8601String(),
                'location' => $event->location,
                'needed' => $needed,
                'filled' => $filled,
                'missing' => max(0, $needed - $filled),
            ];
        })->all();
    }

    /** Escalas próximas que ainda estão incompletas ou sem publicar. */
    private function attention(): array
    {
        $horizon = now()->addDays(14);

        $eventIds = Event::whereBetween('starts_at', [now(), $horizon])
            ->where('status', '!=', 'cancelled')
            ->get()->map(fn ($model) => (string) $model->getKey())->all();

        $events = Event::whereIn('_id', $eventIds)->get()->keyBy(fn ($e) => (string) $e->getKey());

        return Schedule::whereIn('event_id', $eventIds)
            ->whereIn('status', [ScheduleStatus::Draft->value, ScheduleStatus::Published->value])
            ->get()
            ->map(function (Schedule $schedule) use ($events) {
                $needed = $schedule->neededTotal();
                $filled = Assignment::where('schedule_id', (string) $schedule->getKey())->active()->count();
                $event = $events[(string) $schedule->event_id] ?? null;

                return [
                    'schedule_id' => (string) $schedule->getKey(),
                    'name' => $schedule->name,
                    'status' => $schedule->status?->value,
                    'event_title' => $event?->title,
                    'starts_at' => $event?->starts_at?->toIso8601String(),
                    'needed' => $needed,
                    'filled' => $filled,
                    'missing' => max(0, $needed - $filled),
                ];
            })
            ->filter(fn ($row) => $row['missing'] > 0 || $row['status'] === 'draft')
            ->sortBy('starts_at')
            ->take(10)
            ->values()
            ->all();
    }
}
