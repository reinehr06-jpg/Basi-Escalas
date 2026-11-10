<?php

namespace App\Http\Controllers\Api;

use App\Enums\AssignmentStatus;
use App\Models\Absence;
use App\Models\Assignment;
use App\Models\Availability;
use App\Models\Event;
use App\Models\Ministry;
use App\Models\MinistryFunction;
use App\Models\Schedule;
use App\Models\SwapRequest;
use App\Models\Volunteer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Módulo 15 — Painel do voluntário. */
class MeController extends ApiController
{
    public function dashboard(Request $request): JsonResponse
    {
        $volunteer = $this->volunteer($request);

        if (! $volunteer) {
            return response()->json([
                'message' => 'Seu usuário ainda não está vinculado a um cadastro de voluntário.',
                'volunteer' => null,
            ], 200);
        }

        $volunteerId = (string) $volunteer->getKey();

        $upcoming = Assignment::where('volunteer_id', $volunteerId)
            ->active()
            ->where('starts_at', '>=', now())
            ->orderBy('starts_at')
            ->limit(20)
            ->get();

        $events = Event::whereIn('_id', $upcoming->pluck('event_id')->map(fn ($id) => (string) $id)->all())
            ->get()->keyBy(fn ($e) => (string) $e->getKey());

        $functions = MinistryFunction::whereIn('_id', $upcoming->pluck('function_id')->map(fn ($id) => (string) $id)->all())
            ->get()->keyBy(fn ($f) => (string) $f->getKey());

        $ministries = Ministry::whereIn('_id', $volunteer->ministryIds())->get()->keyBy(fn ($m) => (string) $m->getKey());

        $schedules = Schedule::whereIn('_id', $upcoming->pluck('schedule_id')->map(fn ($id) => (string) $id)->all())
            ->get()->keyBy(fn ($s) => (string) $s->getKey());

        $served = Assignment::where('volunteer_id', $volunteerId)
            ->where('attendance_status', 'present')->count();

        return response()->json([
            'volunteer' => $volunteer,
            'ministries' => $ministries->values(),
            'next_assignments' => $upcoming->map(function (Assignment $a) use ($events, $functions, $ministries, $schedules) {
                $event = $events[(string) $a->event_id] ?? null;
                $schedule = $schedules[(string) $a->schedule_id] ?? null;

                return [
                    'id' => (string) $a->getKey(),
                    'status' => $a->status?->value,
                    'attendance_status' => $a->attendance_status?->value,
                    'starts_at' => $a->starts_at?->toIso8601String(),
                    'event_id' => (string) $a->event_id,
                    'event_title' => $event?->title,
                    'event_location' => $event?->location,
                    'ministry_name' => $ministries[(string) $a->ministry_id]->name ?? null,
                    'ministry_color' => $ministries[(string) $a->ministry_id]->color ?? null,
                    'function_name' => $functions[(string) $a->function_id]->name ?? null,
                    'schedule_status' => $schedule?->status?->value,
                    'confirmation_deadline_at' => $schedule?->confirmation_deadline_at?->toIso8601String(),
                    'can_confirm' => $a->status === AssignmentStatus::Pending
                        && $schedule?->status?->value === 'published',
                ];
            })->values(),
            'pending_confirmations' => $upcoming->filter(fn ($a) => $a->status?->value === 'pending')->count(),
            'open_swaps' => SwapRequest::where('requester_volunteer_id', $volunteerId)
                ->whereIn('status', ['open', 'accepted'])->count(),
            'swaps_open_to_me' => SwapRequest::where('status', 'open')
                ->whereNull('target_volunteer_id')
                ->whereIn('ministry_id', $volunteer->ministryIds())
                ->where('requester_volunteer_id', '!=', $volunteerId)
                ->count(),
            'absences' => Absence::where('volunteer_id', $volunteerId)
                ->where('ends_at', '>=', now())->orderBy('starts_at')->get(),
            'availabilities' => Availability::where('volunteer_id', $volunteerId)->orderBy('weekday')->get(),
            'stats' => [
                'served_total' => $served,
                'this_year' => Assignment::where('volunteer_id', $volunteerId)
                    ->where('attendance_status', 'present')
                    ->where('starts_at', '>=', now()->startOfYear())->count(),
                'upcoming' => $upcoming->count(),
            ],
        ]);
    }

    public function assignments(Request $request): JsonResponse
    {
        $volunteer = $this->volunteer($request);

        if (! $volunteer) {
            return response()->json(['data' => [], 'total' => 0]);
        }

        $query = Assignment::where('volunteer_id', (string) $volunteer->getKey())
            ->orderBy('starts_at', 'desc');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($request->boolean('upcoming')) {
            $query->where('starts_at', '>=', now())->orderBy('starts_at');
        }

        return $this->paginate($query, $request);
    }

    private function volunteer(Request $request): ?Volunteer
    {
        $id = $request->user()->volunteer_id;

        return $id ? Volunteer::find($id) : null;
    }
}
