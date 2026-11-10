<?php

namespace App\Services;

use App\Enums\AssignmentStatus;
use App\Models\Assignment;
use App\Models\Event;
use App\Models\Ministry;
use App\Models\MinistryFunction;
use App\Models\Schedule;
use App\Models\Volunteer;
use Illuminate\Support\Collection;

class ScheduleService
{
    public function __construct(private VolunteerEligibilityService $eligibility)
    {
    }

    /** Vagas padrão de um ministério, a partir das funções ativas. */
    public function defaultSlots(string $ministryId): array
    {
        return MinistryFunction::where('ministry_id', $ministryId)
            ->where('status', 'active')
            ->orderBy('order')
            ->get()
            ->map(fn (MinistryFunction $function) => [
                'function_id' => (string) $function->getKey(),
                'needed' => (int) ($function->default_quantity ?: 1),
            ])
            ->values()
            ->all();
    }

    /** Monta a escala com nomes resolvidos e o quanto falta preencher em cada função. */
    public function detail(Schedule $schedule): array
    {
        $event = Event::find($schedule->event_id);
        $ministry = Ministry::find($schedule->ministry_id);

        $assignments = Assignment::where('schedule_id', $schedule->getKey())
            ->whereIn('status', [
                AssignmentStatus::Pending->value,
                AssignmentStatus::Confirmed->value,
                AssignmentStatus::Declined->value,
            ])
            ->get();

        $functions = MinistryFunction::whereIn('_id', collect($schedule->slots ?? [])->pluck('function_id')->all())
            ->get()
            ->keyBy(fn ($f) => (string) $f->getKey());

        $volunteers = Volunteer::whereIn('_id', $assignments->pluck('volunteer_id')->filter()->all())
            ->get()
            ->keyBy(fn ($v) => (string) $v->getKey());

        $slots = collect($schedule->slots ?? [])->map(function (array $slot) use ($assignments, $functions, $volunteers) {
            $functionId = (string) $slot['function_id'];
            $filled = $assignments->filter(fn (Assignment $a) => (string) $a->function_id === $functionId
                && in_array($a->status?->value, ['pending', 'confirmed'], true));

            return [
                'function_id' => $functionId,
                'function_name' => $functions[$functionId]->name ?? 'Função removida',
                'function_color' => $functions[$functionId]->color ?? null,
                'is_leadership' => (bool) ($functions[$functionId]->is_leadership ?? false),
                'needed' => (int) ($slot['needed'] ?? 0),
                'filled' => $filled->count(),
                'missing' => max(0, (int) ($slot['needed'] ?? 0) - $filled->count()),
                'assignments' => $assignments->filter(fn (Assignment $a) => (string) $a->function_id === $functionId)->map(
                    fn (Assignment $a) => $this->assignmentPayload($a, $volunteers)
                )->values()->all(),
            ];
        })->values()->all();

        return [
            'item' => $schedule,
            'event' => $event,
            'ministry' => $ministry,
            'slots' => $slots,
            'summary' => $this->summarize($slots),
        ];
    }

    public function assignmentPayload(Assignment $assignment, Collection $volunteers): array
    {
        $volunteer = $volunteers[(string) $assignment->volunteer_id] ?? null;

        return [
            'id' => (string) $assignment->getKey(),
            'volunteer_id' => (string) $assignment->volunteer_id,
            'volunteer_name' => $volunteer?->name ?? 'Voluntário removido',
            'volunteer_photo_url' => $volunteer?->photo_url,
            'volunteer_phone' => $volunteer?->phone,
            'status' => $assignment->status?->value,
            'attendance_status' => $assignment->attendance_status?->value,
            'confirmed_at' => $assignment->confirmed_at?->toIso8601String(),
            'declined_at' => $assignment->declined_at?->toIso8601String(),
            'decline_reason' => $assignment->decline_reason,
            'checked_in_at' => $assignment->checked_in_at?->toIso8601String(),
            'notes' => $assignment->notes,
        ];
    }

    public function summarize(array $slots): array
    {
        $needed = array_sum(array_column($slots, 'needed'));
        $filled = array_sum(array_column($slots, 'filled'));

        return [
            'needed' => $needed,
            'filled' => $filled,
            'missing' => max(0, $needed - $filled),
            'completion' => $needed > 0 ? (int) round($filled / $needed * 100) : 100,
        ];
    }

    /**
     * Preenche as vagas em aberto com os candidatos mais indicados.
     * Nunca substitui quem já está escalado e nunca escolhe alguém com impedimento.
     *
     * @return array{created:int, unfilled:array}
     */
    public function autofill(Schedule $schedule, bool $allowWarnings = false): array
    {
        $event = Event::findOrFail($schedule->event_id);
        $detail = $this->detail($schedule);

        $alreadyAssigned = Assignment::where('event_id', (string) $event->getKey())
            ->active()
            ->pluck('volunteer_id')
            ->map(fn ($id) => (string) $id)
            ->all();

        $created = 0;
        $unfilled = [];

        foreach ($detail['slots'] as $slot) {
            $missing = (int) $slot['missing'];

            if ($missing <= 0) {
                continue;
            }

            $candidates = $this->eligibility->candidatesFor(
                (string) $schedule->ministry_id,
                $slot['function_id'],
                $event->starts_at->toImmutable(),
                (string) $event->getKey(),
            )->filter(fn ($c) => $c['eligible']
                && ! in_array($c['volunteer']['id'], $alreadyAssigned, true)
                && ($allowWarnings || $c['warnings'] === []));

            foreach ($candidates->take($missing) as $candidate) {
                Assignment::create([
                    'schedule_id' => (string) $schedule->getKey(),
                    'event_id' => (string) $event->getKey(),
                    'ministry_id' => (string) $schedule->ministry_id,
                    'function_id' => $slot['function_id'],
                    'volunteer_id' => $candidate['volunteer']['id'],
                    'starts_at' => $event->starts_at,
                    'assigned_by' => auth()->id(),
                    'assigned_at' => now(),
                ]);

                $alreadyAssigned[] = $candidate['volunteer']['id'];
                $created++;
                $missing--;
            }

            if ($missing > 0) {
                $unfilled[] = [
                    'function_id' => $slot['function_id'],
                    'function_name' => $slot['function_name'],
                    'missing' => $missing,
                ];
            }
        }

        return ['created' => $created, 'unfilled' => $unfilled];
    }
}
