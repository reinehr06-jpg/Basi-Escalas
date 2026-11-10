<?php

namespace App\Http\Controllers\Api;

use App\Enums\EventStatus;
use App\Enums\EventType;
use App\Models\Assignment;
use App\Models\AuditLog;
use App\Models\Event;
use App\Models\Ministry;
use App\Models\Schedule;
use App\Services\RecurrenceService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/** Módulo 04 — Calendário. */
class EventController extends ApiController
{
    public function __construct(private RecurrenceService $recurrence)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = Event::query()->orderBy('starts_at');

        $this->applySearch($query, $request->input('q'), ['title', 'description', 'location']);

        if ($from = $request->input('start')) {
            $query->where('starts_at', '>=', CarbonImmutable::parse($from)->startOfDay());
        }

        if ($to = $request->input('end')) {
            $query->where('starts_at', '<=', CarbonImmutable::parse($to)->endOfDay());
        }

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($ministryId = $request->input('ministry_id')) {
            $query->where('ministry_ids', $ministryId);
        }

        if ($request->boolean('upcoming')) {
            $query->where('starts_at', '>=', now());
        }

        if ($request->boolean('all')) {
            return response()->json(['data' => $query->limit(1000)->get()]);
        }

        return $this->paginate($query, $request);
    }

    public function show(string $id): JsonResponse
    {
        $event = Event::findOrFail($id);
        $schedules = Schedule::where('event_id', $id)->get();

        return response()->json([
            'item' => $event,
            'ministries' => Ministry::whereIn('_id', $event->ministry_ids ?? [])->get(),
            'schedules' => $schedules,
            'assignments_count' => Assignment::where('event_id', $id)->active()->count(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);

        $start = CarbonImmutable::parse($data['starts_at']);
        $duration = isset($data['ends_at'])
            ? $start->diffInMinutes(CarbonImmutable::parse($data['ends_at']))
            : 60;

        $rule = $data['recurrence'] ?? ['frequency' => 'none'];
        $dates = $this->recurrence->expand($start, $rule);

        $seriesId = count($dates) > 1 ? (string) Str::uuid() : null;

        $created = [];

        foreach ($dates as $date) {
            $created[] = Event::create(array_merge($data, [
                'series_id' => $seriesId,
                'starts_at' => $date,
                'ends_at' => $date->addMinutes((int) $duration),
                'recurrence' => $seriesId ? $rule : null,
            ]));
        }

        $first = $created[0];
        $count = count($created);

        AuditLog::record('event.created', $first, "Evento {$first->title} criado ({$count} ocorrência(s))");

        return $this->created($first, $count > 1
            ? "Série criada com {$count} ocorrências."
            : 'Evento criado com sucesso.');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $event = Event::findOrFail($id);
        $data = $this->validated($request);
        unset($data['recurrence']);

        $scope = $request->input('scope', 'single');

        if ($scope === 'series' && $event->series_id) {
            $shift = CarbonImmutable::parse($data['starts_at'])->diffInMinutes($event->starts_at, absolute: false);

            Event::where('series_id', $event->series_id)
                ->where('starts_at', '>=', $event->starts_at)
                ->get()
                ->each(function (Event $occurrence) use ($data, $shift) {
                    $occurrence->update(array_merge($data, [
                        'starts_at' => $occurrence->starts_at->copy()->subMinutes($shift),
                        'ends_at' => $occurrence->ends_at?->copy()->subMinutes($shift),
                    ]));
                });

            AuditLog::record('event.updated', $event, "Série {$event->title} atualizada");

            return $this->updated($event->fresh(), 'Série atualizada com sucesso.');
        }

        $event->update($data);

        AuditLog::record('event.updated', $event, "Evento {$event->title} atualizado");

        return $this->updated($event->fresh(), 'Evento atualizado com sucesso.');
    }

    /** Cancelar preserva o histórico e marca as escalações como canceladas. */
    public function cancel(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
            'scope' => ['sometimes', 'in:single,series'],
        ]);

        $event = Event::findOrFail($id);

        $events = ($data['scope'] ?? 'single') === 'series' && $event->series_id
            ? Event::where('series_id', $event->series_id)->where('starts_at', '>=', $event->starts_at)->get()
            : collect([$event]);

        foreach ($events as $occurrence) {
            $occurrence->update([
                'status' => EventStatus::Cancelled->value,
                'cancellation_reason' => $data['reason'],
            ]);

            Assignment::where('event_id', $occurrence->getKey())->active()
                ->update(['status' => 'cancelled']);

            Schedule::where('event_id', $occurrence->getKey())
                ->update(['status' => 'cancelled']);
        }

        AuditLog::record('event.cancelled', $event, "Evento {$event->title} cancelado: {$data['reason']}");

        return $this->updated($event->fresh(), 'Evento cancelado. As escalações vinculadas foram canceladas.');
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $event = Event::findOrFail($id);

        $assignments = Assignment::where('event_id', $id)->active()->count();

        if ($assignments > 0) {
            return response()->json([
                'message' => "Este evento tem {$assignments} escalação(ões) ativa(s). Cancele o evento em vez de excluí-lo para preservar o histórico.",
            ], 422);
        }

        Schedule::where('event_id', $id)->delete();
        $event->delete();

        AuditLog::record('event.deleted', $event, "Evento {$event->title} excluído");

        return $this->deleted('Evento excluído com sucesso.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'type' => ['sometimes', 'in:'.implode(',', EventType::values())],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['sometimes', 'nullable', 'date', 'after_or_equal:starts_at'],
            'all_day' => ['sometimes', 'boolean'],
            'location' => ['sometimes', 'nullable', 'string', 'max:200'],
            'color' => ['sometimes', 'nullable', 'string', 'max:20'],
            'ministry_ids' => ['sometimes', 'array'],
            'ministry_ids.*' => ['string'],
            'status' => ['sometimes', 'in:'.implode(',', EventStatus::values())],
            'recurrence' => ['sometimes', 'nullable', 'array'],
            'recurrence.frequency' => ['sometimes', 'in:none,daily,weekly,monthly'],
            'recurrence.interval' => ['sometimes', 'integer', 'min:1', 'max:12'],
            'recurrence.weekdays' => ['sometimes', 'array'],
            'recurrence.weekdays.*' => ['integer', 'min:0', 'max:6'],
            'recurrence.count' => ['sometimes', 'integer', 'min:1', 'max:365'],
            'recurrence.until' => ['sometimes', 'nullable', 'date'],
        ]);
    }
}
