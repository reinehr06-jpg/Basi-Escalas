<?php

namespace App\Http\Controllers\Api;

use App\Enums\AssignmentStatus;
use App\Enums\AttendanceStatus;
use App\Models\Assignment;
use App\Models\AuditLog;
use App\Models\Event;
use App\Models\Ministry;
use App\Models\MinistryFunction;
use App\Models\Schedule;
use App\Models\Volunteer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Escalações: criação, confirmações (08) e presenças/check-in (10). */
class AssignmentController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Assignment::query()->orderBy('starts_at');

        foreach (['schedule_id', 'event_id', 'ministry_id', 'function_id', 'volunteer_id', 'status', 'attendance_status'] as $filter) {
            if ($value = $request->input($filter)) {
                $query->where($filter, $value);
            }
        }

        if ($from = $request->input('from')) {
            $query->where('starts_at', '>=', $from);
        }

        if ($to = $request->input('to')) {
            $query->where('starts_at', '<=', $to);
        }

        if ($request->boolean('upcoming')) {
            $query->where('starts_at', '>=', now());
        }

        $perPage = max(1, min((int) ($request->input('itemsPerPage') ?? $request->input('per_page') ?? 10), 200));
        $paginator = $query->paginate($perPage, ['*'], 'page', max(1, (int) ($request->input('page') ?? 1)));

        // As telas de confirmação e presença listam pessoas, não ids:
        // resolver os nomes aqui evita uma enxurrada de chamadas no front.
        $rows = collect($paginator->items());

        $volunteers = Volunteer::whereIn('_id', $rows->pluck('volunteer_id')->filter()->all())
            ->get()->keyBy(fn ($v) => (string) $v->getKey());
        $events = Event::whereIn('_id', $rows->pluck('event_id')->filter()->all())
            ->get()->keyBy(fn ($e) => (string) $e->getKey());
        $ministries = Ministry::whereIn('_id', $rows->pluck('ministry_id')->filter()->all())
            ->get()->keyBy(fn ($m) => (string) $m->getKey());
        $functions = MinistryFunction::whereIn('_id', $rows->pluck('function_id')->filter()->all())
            ->get()->keyBy(fn ($f) => (string) $f->getKey());

        $paginator->through(function (Assignment $assignment) use ($volunteers, $events, $ministries, $functions) {
            $volunteer = $volunteers[(string) $assignment->volunteer_id] ?? null;
            $event = $events[(string) $assignment->event_id] ?? null;
            $ministry = $ministries[(string) $assignment->ministry_id] ?? null;
            $function = $functions[(string) $assignment->function_id] ?? null;

            return $assignment->toArray() + [
                'volunteer_name' => $volunteer?->name,
                'volunteer_photo_url' => $volunteer?->photo_url,
                'volunteer_phone' => $volunteer?->phone,
                'event_title' => $event?->title,
                'event_location' => $event?->location,
                'event_starts_at' => $event?->starts_at?->toIso8601String(),
                'ministry_name' => $ministry?->name,
                'ministry_color' => $ministry?->color,
                'function_name' => $function?->name,
            ];
        });

        return response()->json($paginator);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'schedule_id' => ['required', 'string'],
            'function_id' => ['required', 'string'],
            'volunteer_id' => ['required', 'string'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:500'],
            'force' => ['sometimes', 'boolean'],
        ]);

        $schedule = Schedule::findOrFail($data['schedule_id']);
        $event = Event::findOrFail($schedule->event_id);
        $volunteer = Volunteer::findOrFail($data['volunteer_id']);

        if (! $schedule->isEditable()) {
            return response()->json(['message' => 'Esta escala não pode mais ser alterada.'], 422);
        }

        $duplicate = Assignment::where('event_id', (string) $event->getKey())
            ->where('volunteer_id', $data['volunteer_id'])
            ->active()
            ->first();

        if ($duplicate) {
            return response()->json([
                'message' => "{$volunteer->name} já está escalado neste evento.",
            ], 422);
        }

        $assignment = Assignment::create([
            'schedule_id' => (string) $schedule->getKey(),
            'event_id' => (string) $event->getKey(),
            'ministry_id' => (string) $schedule->ministry_id,
            'function_id' => $data['function_id'],
            'volunteer_id' => $data['volunteer_id'],
            'starts_at' => $event->starts_at,
            'notes' => $data['notes'] ?? null,
            'assigned_by' => auth()->id(),
            'assigned_at' => now(),
        ]);

        AuditLog::record('assignment.created', $assignment, "{$volunteer->name} escalado em {$event->title}");

        return $this->created($assignment, "{$volunteer->name} foi escalado.");
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $assignment = Assignment::findOrFail($id);

        $data = $request->validate([
            'function_id' => ['sometimes', 'string'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        $assignment->update($data);

        return $this->updated($assignment->fresh(), 'Escalação atualizada.');
    }

    public function destroy(string $id): JsonResponse
    {
        $assignment = Assignment::findOrFail($id);
        $assignment->delete();

        AuditLog::record('assignment.removed', $assignment, 'Voluntário removido da escala');

        return $this->deleted('Voluntário removido da escala.');
    }

    /** Módulo 08 — o voluntário (ou o líder por ele) confirma presença. */
    public function confirm(Request $request, string $id): JsonResponse
    {
        $assignment = Assignment::findOrFail($id);

        $this->authorizeVolunteerAction($request, $assignment);

        if ($assignment->status === AssignmentStatus::Cancelled) {
            return response()->json(['message' => 'Esta escalação foi cancelada.'], 422);
        }

        $assignment->update([
            'status' => AssignmentStatus::Confirmed->value,
            'confirmed_at' => now(),
            'declined_at' => null,
            'decline_reason' => null,
        ]);

        AuditLog::record('assignment.confirmed', $assignment, 'Presença confirmada');

        return $this->updated($assignment->fresh(), 'Presença confirmada.');
    }

    /** Módulo 08 — recusa, que abre caminho para substituição. */
    public function decline(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $assignment = Assignment::findOrFail($id);

        $this->authorizeVolunteerAction($request, $assignment);

        $assignment->update([
            'status' => AssignmentStatus::Declined->value,
            'declined_at' => now(),
            'decline_reason' => $data['reason'],
        ]);

        AuditLog::record('assignment.declined', $assignment, "Escalação recusada: {$data['reason']}");

        return $this->updated(
            $assignment->fresh(),
            'Recusa registrada. A vaga voltou a ficar em aberto para substituição.'
        );
    }

    /** Módulo 10 — check-in / presença no dia. */
    public function checkin(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'attendance_status' => ['required', 'in:'.implode(',', AttendanceStatus::values())],
            'note' => ['sometimes', 'nullable', 'string', 'max:500'],
            'method' => ['sometimes', 'in:manual,qrcode,self'],
        ]);

        $assignment = Assignment::findOrFail($id);

        $assignment->update([
            'attendance_status' => $data['attendance_status'],
            'attendance_note' => $data['note'] ?? null,
            'checkin_method' => $data['method'] ?? 'manual',
            'checked_in_at' => now(),
            'checked_in_by' => auth()->id(),
        ]);

        return $this->updated($assignment->fresh(), 'Presença registrada.');
    }

    /** Check-in em lote na tela do evento. */
    public function bulkCheckin(Request $request): JsonResponse
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.assignment_id' => ['required', 'string'],
            'items.*.attendance_status' => ['required', 'in:'.implode(',', AttendanceStatus::values())],
            'items.*.note' => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        $updated = 0;

        foreach ($data['items'] as $item) {
            $assignment = Assignment::find($item['assignment_id']);

            if (! $assignment) {
                continue;
            }

            $assignment->update([
                'attendance_status' => $item['attendance_status'],
                'attendance_note' => $item['note'] ?? null,
                'checkin_method' => 'manual',
                'checked_in_at' => now(),
                'checked_in_by' => auth()->id(),
            ]);

            $updated++;
        }

        return response()->json([
            'message' => "{$updated} presença(s) registrada(s).",
            'updated' => $updated,
        ]);
    }

    /** Um voluntário só mexe na própria escalação; líderes e coordenação podem por ele. */
    private function authorizeVolunteerAction(Request $request, Assignment $assignment): void
    {
        $user = $request->user();

        if ($user->isGlobal()) {
            return;
        }

        $isOwner = $user->volunteer_id && (string) $user->volunteer_id === (string) $assignment->volunteer_id;
        $isLeader = in_array((string) $assignment->ministry_id, $user->ledMinistryIds(), true);

        abort_unless($isOwner || $isLeader, 403, 'Você não pode alterar a escalação de outro voluntário.');
    }
}
