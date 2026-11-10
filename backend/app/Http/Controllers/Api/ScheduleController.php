<?php

namespace App\Http\Controllers\Api;

use App\Enums\ScheduleStatus;
use App\Models\Assignment;
use App\Models\AuditLog;
use App\Models\Event;
use App\Models\Ministry;
use App\Models\Schedule;
use App\Services\ScheduleService;
use App\Services\VolunteerEligibilityService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Módulo 05 — Escalas. */
class ScheduleController extends ApiController
{
    public function __construct(
        private ScheduleService $schedules,
        private VolunteerEligibilityService $eligibility,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $query = Schedule::query()->orderBy('created_at', 'desc');

        $this->applySearch($query, $request->input('q'), ['name', 'notes']);

        foreach (['event_id', 'ministry_id', 'status'] as $filter) {
            if ($value = $request->input($filter)) {
                $query->where($filter, $value);
            }
        }

        if (! $request->user()->isGlobal()) {
            $led = $request->user()->ledMinistryIds();
            if ($led !== []) {
                $query->whereIn('ministry_id', $led);
            }
        }

        // Filtro por data do evento: resolve os eventos da janela primeiro.
        if ($request->filled('start') || $request->filled('end')) {
            $events = Event::query();

            if ($start = $request->input('start')) {
                $events->where('starts_at', '>=', CarbonImmutable::parse($start)->startOfDay());
            }

            if ($end = $request->input('end')) {
                $events->where('starts_at', '<=', CarbonImmutable::parse($end)->endOfDay());
            }

            $query->whereIn('event_id', $events->get()->map(fn ($model) => (string) $model->getKey())->all());
        }

        return $this->paginate($query, $request);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(
            $this->schedules->detail(Schedule::findOrFail($id))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'event_id' => ['required', 'string'],
            'ministry_id' => ['required', 'string'],
            'name' => ['sometimes', 'nullable', 'string', 'max:160'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'slots' => ['sometimes', 'array'],
            'slots.*.function_id' => ['required', 'string'],
            'slots.*.needed' => ['required', 'integer', 'min:0', 'max:200'],
        ]);

        $event = Event::findOrFail($data['event_id']);
        $ministry = Ministry::findOrFail($data['ministry_id']);

        $existing = Schedule::where('event_id', $data['event_id'])
            ->where('ministry_id', $data['ministry_id'])
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Já existe uma escala deste ministério para este evento.',
                'item' => $existing,
            ], 422);
        }

        $deadlineHours = $ministry->settings['confirmation_deadline_hours'] ?? 48;

        $schedule = Schedule::create([
            'event_id' => (string) $event->getKey(),
            'ministry_id' => (string) $ministry->getKey(),
            'name' => $data['name'] ?? "{$ministry->name} — {$event->title}",
            'notes' => $data['notes'] ?? null,
            'slots' => $data['slots'] ?? $this->schedules->defaultSlots((string) $ministry->getKey()),
            'confirmation_deadline_at' => $event->starts_at->copy()->subHours((int) $deadlineHours),
        ]);

        AuditLog::record('schedule.created', $schedule, "Escala criada: {$schedule->name}");

        return $this->detailResponse($schedule, 'Escala criada com sucesso.', 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $schedule = Schedule::findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'nullable', 'string', 'max:160'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'slots' => ['sometimes', 'array'],
            'slots.*.function_id' => ['required', 'string'],
            'slots.*.needed' => ['required', 'integer', 'min:0', 'max:200'],
            'confirmation_deadline_at' => ['sometimes', 'nullable', 'date'],
        ]);

        if (! $schedule->isEditable()) {
            return response()->json(['message' => 'Esta escala está encerrada ou cancelada e não pode ser alterada.'], 422);
        }

        $schedule->update($data);

        return $this->detailResponse($schedule->fresh(), 'Escala atualizada com sucesso.');
    }

    /** Publicar abre as confirmações para os voluntários escalados. */
    public function publish(Request $request, string $id): JsonResponse
    {
        $schedule = Schedule::findOrFail($id);

        if ($schedule->status === ScheduleStatus::Published) {
            return response()->json(['message' => 'Esta escala já está publicada.'], 422);
        }

        $detail = $this->schedules->detail($schedule);

        if ($detail['summary']['filled'] === 0) {
            return response()->json(['message' => 'Escale pelo menos um voluntário antes de publicar.'], 422);
        }

        if ($detail['summary']['missing'] > 0 && ! $request->boolean('force')) {
            return response()->json([
                'message' => "Faltam {$detail['summary']['missing']} vaga(s) para completar a escala.",
                'summary' => $detail['summary'],
                'requires_force' => true,
            ], 422);
        }

        $schedule->update([
            'status' => ScheduleStatus::Published->value,
            'published_at' => now(),
            'published_by' => auth()->id(),
        ]);

        AuditLog::record('schedule.published', $schedule, "Escala publicada: {$schedule->name}");

        return $this->detailResponse($schedule->fresh(), 'Escala publicada. Os voluntários já podem confirmar.');
    }

    public function close(string $id): JsonResponse
    {
        $schedule = Schedule::findOrFail($id);

        $schedule->update([
            'status' => ScheduleStatus::Closed->value,
            'closed_at' => now(),
        ]);

        AuditLog::record('schedule.closed', $schedule, "Escala encerrada: {$schedule->name}");

        return $this->updated($schedule->fresh(), 'Escala encerrada.');
    }

    /** Copia a estrutura e, opcionalmente, as pessoas para outro evento. */
    public function duplicate(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'event_id' => ['required', 'string'],
            'copy_volunteers' => ['sometimes', 'boolean'],
        ]);

        $source = Schedule::findOrFail($id);
        $event = Event::findOrFail($data['event_id']);

        $exists = Schedule::where('event_id', $data['event_id'])
            ->where('ministry_id', $source->ministry_id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'O evento de destino já tem uma escala deste ministério.'], 422);
        }

        $copy = Schedule::create([
            'event_id' => (string) $event->getKey(),
            'ministry_id' => (string) $source->ministry_id,
            'name' => $source->name,
            'notes' => $source->notes,
            'slots' => $source->slots,
            'confirmation_deadline_at' => $event->starts_at->copy()->subHours(48),
        ]);

        $copied = 0;

        if ($request->boolean('copy_volunteers')) {
            $taken = [];

            foreach (Assignment::where('schedule_id', $id)->active()->get() as $assignment) {
                if (in_array((string) $assignment->volunteer_id, $taken, true)) {
                    continue;
                }

                Assignment::create([
                    'schedule_id' => (string) $copy->getKey(),
                    'event_id' => (string) $event->getKey(),
                    'ministry_id' => (string) $source->ministry_id,
                    'function_id' => (string) $assignment->function_id,
                    'volunteer_id' => (string) $assignment->volunteer_id,
                    'starts_at' => $event->starts_at,
                    'assigned_by' => auth()->id(),
                    'assigned_at' => now(),
                ]);

                $taken[] = (string) $assignment->volunteer_id;
                $copied++;
            }
        }

        return $this->detailResponse(
            $copy,
            $copied > 0 ? "Escala duplicada com {$copied} voluntário(s)." : 'Escala duplicada.',
            201,
        );
    }

    /** Candidatos para uma função, com impedimentos e alertas explicados. */
    public function candidates(Request $request, string $id): JsonResponse
    {
        $request->validate(['function_id' => ['required', 'string']]);

        $schedule = Schedule::findOrFail($id);
        $event = Event::findOrFail($schedule->event_id);

        $candidates = $this->eligibility->candidatesFor(
            (string) $schedule->ministry_id,
            $request->input('function_id'),
            $event->starts_at->toImmutable(),
            (string) $event->getKey(),
        );

        return response()->json(['data' => $candidates]);
    }

    public function autofill(Request $request, string $id): JsonResponse
    {
        $schedule = Schedule::findOrFail($id);

        if (! $schedule->isEditable()) {
            return response()->json(['message' => 'Esta escala não pode mais ser alterada.'], 422);
        }

        $result = $this->schedules->autofill($schedule, $request->boolean('allow_warnings'));

        $message = $result['created'] > 0
            ? "{$result['created']} vaga(s) preenchida(s) automaticamente."
            : 'Nenhum voluntário elegível encontrado para as vagas em aberto.';

        if ($result['unfilled'] !== []) {
            $message .= ' Ainda faltam pessoas em: '
                .implode(', ', array_map(fn ($u) => "{$u['function_name']} ({$u['missing']})", $result['unfilled'])).'.';
        }

        AuditLog::record('schedule.autofilled', $schedule, $message);

        return response()->json([
            'message' => $message,
            'created' => $result['created'],
            'unfilled' => $result['unfilled'],
        ] + $this->schedules->detail($schedule->fresh()));
    }

    public function destroy(string $id): JsonResponse
    {
        $schedule = Schedule::findOrFail($id);

        if ($schedule->status === ScheduleStatus::Published) {
            return response()->json([
                'message' => 'Escalas publicadas não podem ser excluídas. Encerre ou cancele a escala.',
            ], 422);
        }

        Assignment::where('schedule_id', $id)->delete();
        $schedule->delete();

        AuditLog::record('schedule.deleted', $schedule, "Escala excluída: {$schedule->name}");

        return $this->deleted('Escala excluída com sucesso.');
    }

    /** Resposta padrão de escala: mensagem + item + slots resolvidos. */
    private function detailResponse(Schedule $schedule, string $message, int $status = 200): JsonResponse
    {
        return response()->json(
            ['message' => $message] + $this->schedules->detail($schedule),
            $status,
        );
    }
}
