<?php

namespace App\Services;

use Carbon\CarbonImmutable;

/**
 * Expande uma regra de recorrência em datas concretas.
 *
 * Mantemos as ocorrências materializadas (um documento por data) porque
 * escala, confirmação e presença pertencem a uma data específica —
 * calcular a série em tempo de consulta tornaria tudo isso ambíguo.
 */
class RecurrenceService
{
    public const MAX_OCCURRENCES = 365;

    /**
     * @param  array  $rule  { frequency: none|daily|weekly|monthly, interval, weekdays: [0..6], count, until }
     * @return CarbonImmutable[]
     */
    public function expand(CarbonImmutable $start, array $rule): array
    {
        $frequency = $rule['frequency'] ?? 'none';

        if ($frequency === 'none' || $frequency === null) {
            return [$start];
        }

        $interval = max(1, (int) ($rule['interval'] ?? 1));
        $until = isset($rule['until']) && $rule['until']
            ? CarbonImmutable::parse($rule['until'])->endOfDay()
            : $start->addYear();
        $limit = min((int) ($rule['count'] ?? self::MAX_OCCURRENCES), self::MAX_OCCURRENCES);

        $weekdays = array_map('intval', $rule['weekdays'] ?? []);

        $dates = [];
        $cursor = $start;
        $guard = 0;

        while (count($dates) < $limit && $cursor->lte($until) && $guard < 5000) {
            $guard++;

            if ($frequency === 'weekly' && $weekdays !== []) {
                $weekStart = $cursor->startOfWeek(CarbonImmutable::SUNDAY);

                foreach ($weekdays as $weekday) {
                    $candidate = $weekStart->addDays($weekday)
                        ->setTime((int) $start->format('H'), (int) $start->format('i'));

                    if ($candidate->gte($start) && $candidate->lte($until) && count($dates) < $limit) {
                        $dates[$candidate->toIso8601String()] = $candidate;
                    }
                }

                $cursor = $cursor->addWeeks($interval);

                continue;
            }

            $dates[$cursor->toIso8601String()] = $cursor;

            $cursor = match ($frequency) {
                'daily' => $cursor->addDays($interval),
                'weekly' => $cursor->addWeeks($interval),
                'monthly' => $cursor->addMonthsNoOverflow($interval),
                default => $until->addDay(),
            };
        }

        $dates = array_values($dates);
        usort($dates, fn ($a, $b) => $a <=> $b);

        return $dates;
    }
}
