<?php

namespace App\Services;

use App\Enums\AbsenceStatus;
use App\Models\Absence;
use App\Models\Assignment;
use App\Models\Availability;
use App\Models\Ministry;
use App\Models\MinistryFunction;
use App\Models\Volunteer;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

/**
 * Decide quem pode ser escalado e em que ordem sugerir.
 *
 * Separa impedimentos (blockers) de alertas (warnings): o líder continua
 * podendo escalar alguém com alerta, mas nunca por engano.
 */
class VolunteerEligibilityService
{
    /**
     * @return Collection<int, array> candidatos ordenados do mais ao menos indicado
     */
    public function candidatesFor(
        string $ministryId,
        string $functionId,
        CarbonInterface $date,
        ?string $eventId = null,
    ): Collection {
        $ministry = Ministry::find($ministryId);
        $function = MinistryFunction::find($functionId);

        $volunteers = Volunteer::where('memberships.ministry_id', $ministryId)->get()
            ->filter(fn (Volunteer $v) => in_array($functionId, $v->functionIdsFor($ministryId), true));

        if ($volunteers->isEmpty()) {
            return collect();
        }

        $ids = $volunteers->map(fn ($v) => (string) $v->getKey())->all();

        $absences = Absence::whereIn('volunteer_id', $ids)
            ->where('status', AbsenceStatus::Approved->value)
            ->where('starts_at', '<=', $date->copy()->endOfDay())
            ->where('ends_at', '>=', $date->copy()->startOfDay())
            ->get()
            ->groupBy('volunteer_id');

        $availabilities = Availability::whereIn('volunteer_id', $ids)
            ->where('weekday', (int) $date->dayOfWeek)
            ->get()
            ->groupBy('volunteer_id');

        $sameEvent = $eventId
            ? Assignment::where('event_id', $eventId)->active()->get()->groupBy('volunteer_id')
            : collect();

        $windowStart = $date->copy()->subDays(90);
        $windowEnd = $date->copy()->addDays(90);

        $nearby = Assignment::whereIn('volunteer_id', $ids)
            ->active()
            ->where('starts_at', '>=', $windowStart)
            ->where('starts_at', '<=', $windowEnd)
            ->get()
            ->groupBy('volunteer_id');

        $defaults = $ministry?->settings ?? [];

        return $volunteers->map(function (Volunteer $volunteer) use (
            $date, $absences, $availabilities, $sameEvent, $nearby, $defaults, $function
        ) {
            $id = (string) $volunteer->getKey();
            $blockers = [];
            $warnings = [];

            if ($volunteer->status?->value !== 'active') {
                $blockers[] = ['code' => 'inactive', 'message' => 'Voluntário inativo ou afastado.'];
            }

            if (($absences[$id] ?? collect())->isNotEmpty()) {
                $absence = $absences[$id]->first();
                $blockers[] = ['code' => 'absence', 'message' => 'Ausência aprovada nesta data'.($absence->reason ? ": {$absence->reason}" : '.')];
            }

            $dayRules = $availabilities[$id] ?? collect();
            if ($dayRules->isNotEmpty() && $dayRules->every(fn ($rule) => ! $rule->is_available)) {
                $blockers[] = ['code' => 'unavailable', 'message' => 'Indisponível neste dia da semana.'];
            }

            if (($sameEvent[$id] ?? collect())->isNotEmpty()) {
                $blockers[] = ['code' => 'conflict', 'message' => 'Já escalado neste mesmo evento.'];
            }

            $history = $nearby[$id] ?? collect();

            $minRest = $volunteer->preferences['min_rest_days'] ?? $defaults['min_rest_days'] ?? null;
            if ($minRest) {
                $tooClose = $history->first(function ($assignment) use ($date, $minRest) {
                    $diff = $date->diffInDays($assignment->starts_at, absolute: true);

                    return $diff > 0 && $diff < (int) $minRest;
                });

                if ($tooClose) {
                    $warnings[] = ['code' => 'rest', 'message' => "Escalado há menos de {$minRest} dia(s) de intervalo."];
                }
            }

            $maxPerMonth = $volunteer->preferences['max_per_month'] ?? $defaults['max_per_month'] ?? null;
            $inMonth = $history->filter(fn ($a) => $a->starts_at
                && $a->starts_at->isSameMonth($date))->count();

            if ($maxPerMonth && $inMonth >= (int) $maxPerMonth) {
                $warnings[] = ['code' => 'overload', 'message' => "Já tem {$inMonth} escala(s) no mês (limite {$maxPerMonth})."];
            }

            $required = $function?->required_skill_ids ?? [];
            $missing = array_diff($required, $volunteer->skillIds());
            if ($missing !== []) {
                $warnings[] = ['code' => 'skill', 'message' => 'Não possui todas as habilidades exigidas pela função.'];
            }

            $preferred = $volunteer->preferences['preferred_weekdays'] ?? [];
            if ($preferred !== [] && ! in_array((int) $date->dayOfWeek, array_map('intval', $preferred), true)) {
                $warnings[] = ['code' => 'weekday', 'message' => 'Fora dos dias que o voluntário prefere servir.'];
            }

            $lastServed = $history->filter(fn ($a) => $a->starts_at && $a->starts_at->lt($date))
                ->sortByDesc('starts_at')->first()?->starts_at;

            return [
                'volunteer' => [
                    'id' => $id,
                    'name' => $volunteer->name,
                    'photo_url' => $volunteer->photo_url,
                    'email' => $volunteer->email,
                    'phone' => $volunteer->phone,
                    'status' => $volunteer->status?->value,
                ],
                'eligible' => $blockers === [],
                'blockers' => $blockers,
                'warnings' => $warnings,
                'load_30d' => $history->filter(fn ($a) => $a->starts_at
                    && $a->starts_at->between($date->copy()->subDays(30), $date))->count(),
                'load_month' => $inMonth,
                'last_served_at' => $lastServed?->toIso8601String(),
                'score' => $this->score($blockers, $warnings, $inMonth, $lastServed, $date),
            ];
        })
            ->sortByDesc('score')
            ->values();
    }

    /** Quanto maior, mais indicado: prioriza quem está livre e há mais tempo sem servir. */
    private function score(array $blockers, array $warnings, int $inMonth, $lastServed, CarbonInterface $date): int
    {
        if ($blockers !== []) {
            return -1000;
        }

        $score = 100;
        $score -= count($warnings) * 15;
        $score -= $inMonth * 8;

        if ($lastServed) {
            $score += min((int) $date->diffInDays($lastServed, absolute: true), 60);
        } else {
            $score += 60;
        }

        return $score;
    }
}
