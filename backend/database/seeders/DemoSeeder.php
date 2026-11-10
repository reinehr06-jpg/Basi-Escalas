<?php

namespace Database\Seeders;

use App\Enums\AssignmentStatus;
use App\Enums\AttendanceStatus;
use App\Enums\EventType;
use App\Enums\ScheduleStatus;
use App\Enums\UserRole;
use App\Models\Absence;
use App\Models\Assignment;
use App\Models\Availability;
use App\Models\Event;
use App\Models\Ministry;
use App\Models\MinistryFunction;
use App\Models\Organization;
use App\Models\Schedule;
use App\Models\Skill;
use App\Models\SwapRequest;
use App\Models\User;
use App\Models\Volunteer;
use App\Support\OrganizationContext;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Dados de demonstração suficientes para exercitar todos os módulos:
 * ministérios, funções, voluntários, calendário, escalas, confirmações,
 * presenças, ausências e trocas.
 */
class DemoSeeder extends Seeder
{
    private const MINISTRIES = [
        ['Louvor', '#7C3AED', ['Vocal principal', 'Back vocal', 'Guitarra', 'Baixo', 'Bateria', 'Teclado']],
        ['Mídia', '#0EA5E9', ['Operador de som', 'Projeção', 'Câmera', 'Transmissão']],
        ['Recepção', '#F59E0B', ['Porta principal', 'Estacionamento', 'Acolhimento']],
        ['Kids', '#EC4899', ['Professor', 'Auxiliar', 'Recepção Kids']],
        ['Diaconia', '#10B981', ['Ceia', 'Ofertas', 'Apoio geral']],
    ];

    private const FIRST_NAMES = [
        'Ana', 'Bruno', 'Camila', 'Daniel', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique',
        'Isabela', 'João', 'Karina', 'Lucas', 'Mariana', 'Nathan', 'Olívia', 'Paulo',
        'Queila', 'Rafael', 'Sofia', 'Thiago', 'Ursula', 'Vinícius', 'Wesley', 'Yasmin',
        'Zeca', 'Beatriz', 'Caio', 'Débora', 'Elias', 'Fernanda',
    ];

    private const LAST_NAMES = [
        'Almeida', 'Barbosa', 'Cardoso', 'Dias', 'Esteves', 'Ferreira', 'Gomes',
        'Henriques', 'Ibrahim', 'Jardim', 'Klein', 'Lima', 'Martins', 'Nogueira',
    ];

    public function run(): void
    {
        $organization = Organization::firstOrCreate(
            ['slug' => 'igreja-demo'],
            ['name' => 'Igreja Demonstração', 'email' => 'contato@igrejademo.test'],
        );

        $organizationId = (string) $organization->getKey();
        app(OrganizationContext::class)->set($organizationId);

        $this->command?->info("Organização: {$organization->name}");

        $skills = $this->seedSkills();
        [$ministries, $functions] = $this->seedMinistries($skills);
        $volunteers = $this->seedVolunteers($ministries, $functions, $skills);

        $this->seedUsers($volunteers);
        $events = $this->seedEvents($ministries);
        $this->seedSchedules($events, $ministries, $functions, $volunteers);
        $this->seedAbsencesAndSwaps($volunteers, $ministries);

        $this->command?->info('Seed concluído.');
        $this->command?->table(
            ['Coleção', 'Registros'],
            [
                ['ministries', Ministry::count()],
                ['functions', MinistryFunction::count()],
                ['volunteers', Volunteer::count()],
                ['events', Event::count()],
                ['schedules', Schedule::count()],
                ['assignments', Assignment::count()],
                ['users', User::count()],
            ],
        );
    }

    private function seedSkills(): array
    {
        $definitions = [
            ['Canto afinado', 'vocal'],
            ['Leitura de cifra', 'musica'],
            ['Mesa de som digital', 'tecnica'],
            ['Operação de câmera', 'tecnica'],
            ['Pedagogia infantil', 'ensino'],
            ['Primeiros socorros', 'seguranca'],
        ];

        $skills = [];

        foreach ($definitions as [$name, $category]) {
            $skills[$name] = Skill::firstOrCreate(
                ['name' => $name],
                [
                    'category' => $category,
                    'levels' => ['básico', 'intermediário', 'avançado'],
                    'requires_certification' => $category === 'seguranca',
                    'validity_months' => $category === 'seguranca' ? 24 : null,
                ],
            );
        }

        return $skills;
    }

    private function seedMinistries(array $skills): array
    {
        $ministries = [];
        $functions = [];

        foreach (self::MINISTRIES as [$name, $color, $functionNames]) {
            $ministry = Ministry::firstOrCreate(
                ['name' => $name],
                [
                    'color' => $color,
                    'description' => "Equipe de {$name} da igreja.",
                    'settings' => [
                        'confirmation_deadline_hours' => 48,
                        'min_rest_days' => 7,
                        'max_per_month' => 5,
                    ],
                ],
            );

            $ministries[$name] = $ministry;
            $functions[$name] = [];

            foreach ($functionNames as $order => $functionName) {
                $required = match ($functionName) {
                    'Vocal principal', 'Back vocal' => [(string) $skills['Canto afinado']->getKey()],
                    'Operador de som' => [(string) $skills['Mesa de som digital']->getKey()],
                    'Câmera' => [(string) $skills['Operação de câmera']->getKey()],
                    'Professor' => [(string) $skills['Pedagogia infantil']->getKey()],
                    default => [],
                };

                $functions[$name][$functionName] = MinistryFunction::firstOrCreate(
                    ['ministry_id' => (string) $ministry->getKey(), 'name' => $functionName],
                    [
                        'order' => $order,
                        'default_quantity' => str_contains($functionName, 'Back vocal') ? 2 : 1,
                        'is_leadership' => $order === 0,
                        'required_skill_ids' => $required,
                        'color' => $color,
                    ],
                );
            }
        }

        return [$ministries, $functions];
    }

    private function seedVolunteers(array $ministries, array $functions, array $skills): array
    {
        if (Volunteer::count() > 0) {
            return Volunteer::all()->all();
        }

        $volunteers = [];
        $ministryNames = array_keys($ministries);

        foreach (self::FIRST_NAMES as $index => $first) {
            $last = self::LAST_NAMES[$index % count(self::LAST_NAMES)];
            $name = "{$first} {$last}";

            // Cada pessoa serve em um ou dois ministérios, com funções coerentes.
            $primary = $ministryNames[$index % count($ministryNames)];
            $chosen = [$primary];

            if ($index % 4 === 0) {
                $secondary = $ministryNames[($index + 2) % count($ministryNames)];
                if ($secondary !== $primary) {
                    $chosen[] = $secondary;
                }
            }

            $memberships = [];

            foreach ($chosen as $ministryName) {
                $available = array_keys($functions[$ministryName]);
                $pick = array_slice($available, $index % max(1, count($available) - 1), 2);

                $memberships[] = [
                    'ministry_id' => (string) $ministries[$ministryName]->getKey(),
                    'function_ids' => array_values(array_map(
                        fn ($f) => (string) $functions[$ministryName][$f]->getKey(),
                        $pick,
                    )),
                    'is_leader' => $index % 7 === 0,
                    'since' => now()->subMonths($index % 24)->toDateString(),
                ];
            }

            $volunteerSkills = [];
            foreach (array_slice(array_keys($skills), 0, ($index % 3) + 1) as $skillName) {
                $volunteerSkills[] = [
                    'skill_id' => (string) $skills[$skillName]->getKey(),
                    'level' => ['básico', 'intermediário', 'avançado'][$index % 3],
                    'certified_at' => now()->subMonths(($index % 12) + 1)->toDateString(),
                ];
            }

            $volunteer = Volunteer::create([
                'name' => $name,
                'email' => Str::slug($name, '.').'@igrejademo.test',
                'phone' => '+5551'.str_pad((string) (900000000 + $index), 9, '0', STR_PAD_LEFT),
                'birth_date' => now()->subYears(18 + ($index % 35))->subDays($index * 3)->toDateString(),
                'status' => $index % 13 === 0 ? 'on_leave' : 'active',
                'joined_at' => now()->subMonths($index % 36)->toDateString(),
                'memberships' => $memberships,
                'skills' => $volunteerSkills,
                'preferences' => [
                    'max_per_month' => 4 + ($index % 3),
                    'min_rest_days' => 7,
                    'preferred_weekdays' => $index % 5 === 0 ? [0] : [0, 3, 6],
                ],
            ]);

            // Metade declara indisponibilidade em um dia da semana.
            if ($index % 2 === 0) {
                Availability::create([
                    'volunteer_id' => (string) $volunteer->getKey(),
                    'weekday' => ($index % 5) + 1,
                    'is_available' => false,
                    'note' => 'Trabalho',
                ]);
            }

            $volunteers[] = $volunteer;
        }

        // Líderes dos ministérios.
        foreach (array_values($ministries) as $position => $ministry) {
            $leader = $volunteers[$position * 3] ?? $volunteers[0];
            $ministry->update(['leader_ids' => [(string) $leader->getKey()]]);
        }

        return $volunteers;
    }

    private function seedUsers(array $volunteers): void
    {
        $admin = $volunteers[0];

        User::firstOrCreate(
            ['email' => 'admin@igrejademo.test'],
            [
                'name' => 'Administrador',
                'password' => 'escalas123',
                'role' => UserRole::Admin->value,
                'volunteer_id' => (string) $admin->getKey(),
            ],
        );

        User::firstOrCreate(
            ['email' => 'lider@igrejademo.test'],
            [
                'name' => $volunteers[3]->name,
                'password' => 'escalas123',
                'role' => UserRole::MinistryLeader->value,
                'volunteer_id' => (string) $volunteers[3]->getKey(),
            ],
        );

        User::firstOrCreate(
            ['email' => 'voluntario@igrejademo.test'],
            [
                'name' => $volunteers[5]->name,
                'password' => 'escalas123',
                'role' => UserRole::Volunteer->value,
                'volunteer_id' => (string) $volunteers[5]->getKey(),
            ],
        );
    }

    private function seedEvents(array $ministries): array
    {
        if (Event::count() > 0) {
            return Event::orderBy('starts_at')->get()->all();
        }

        $ministryIds = array_map(fn ($m) => (string) $m->getKey(), array_values($ministries));
        $series = (string) Str::uuid();
        $events = [];

        // 6 domingos atrás e 8 à frente: dá histórico para relatórios e futuro para escalar.
        $sunday = CarbonImmutable::now()->startOfWeek(CarbonImmutable::SUNDAY)->setTime(19, 0);

        for ($week = -6; $week <= 8; $week++) {
            $date = $sunday->addWeeks($week);

            $events[] = Event::create([
                'series_id' => $series,
                'title' => 'Culto de Celebração',
                'type' => EventType::Service->value,
                'starts_at' => $date,
                'ends_at' => $date->addHours(2),
                'location' => 'Templo Sede',
                'ministry_ids' => $ministryIds,
                'status' => $week < 0 ? 'done' : 'confirmed',
                'recurrence' => ['frequency' => 'weekly', 'interval' => 1, 'weekdays' => [0]],
            ]);

            // Ensaio do louvor na quinta anterior.
            $rehearsal = $date->subDays(3)->setTime(20, 0);

            $events[] = Event::create([
                'title' => 'Ensaio do Louvor',
                'type' => EventType::Rehearsal->value,
                'starts_at' => $rehearsal,
                'ends_at' => $rehearsal->addHours(2),
                'location' => 'Sala de música',
                'ministry_ids' => [(string) $ministries['Louvor']->getKey()],
                'status' => $week < 0 ? 'done' : 'planned',
            ]);
        }

        return $events;
    }

    private function seedSchedules(array $events, array $ministries, array $functions, array $volunteers): void
    {
        if (Schedule::count() > 0) {
            return;
        }

        $pool = collect($volunteers)->filter(fn (Volunteer $v) => $v->status?->value === 'active')->values();
        $cursor = 0;

        foreach ($events as $event) {
            if ($event->type?->value !== 'service') {
                continue;
            }

            $isPast = $event->starts_at->isPast();

            foreach ($ministries as $ministryName => $ministry) {
                $ministryId = (string) $ministry->getKey();

                $slots = collect($functions[$ministryName])
                    ->map(fn (MinistryFunction $f) => [
                        'function_id' => (string) $f->getKey(),
                        'needed' => (int) $f->default_quantity,
                    ])->values()->all();

                $schedule = Schedule::create([
                    'event_id' => (string) $event->getKey(),
                    'ministry_id' => $ministryId,
                    'name' => "{$ministryName} — {$event->title}",
                    'slots' => $slots,
                    'status' => $isPast ? ScheduleStatus::Closed->value : ScheduleStatus::Published->value,
                    'confirmation_deadline_at' => $event->starts_at->copy()->subHours(48),
                    'published_at' => $event->starts_at->copy()->subDays(10),
                ]);

                $taken = [];

                foreach ($slots as $slot) {
                    for ($i = 0; $i < $slot['needed']; $i++) {
                        // Procura alguém do ministério que ainda não está neste evento.
                        $candidate = null;

                        for ($attempt = 0; $attempt < $pool->count(); $attempt++) {
                            $maybe = $pool[($cursor + $attempt) % $pool->count()];
                            $id = (string) $maybe->getKey();

                            if (in_array($id, $taken, true)) {
                                continue;
                            }

                            if (! in_array($ministryId, $maybe->ministryIds(), true)) {
                                continue;
                            }

                            $candidate = $maybe;
                            $cursor = ($cursor + $attempt + 1) % $pool->count();
                            break;
                        }

                        if (! $candidate) {
                            continue;
                        }

                        $taken[] = (string) $candidate->getKey();

                        $status = match (true) {
                            $isPast => AssignmentStatus::Confirmed->value,
                            $cursor % 5 === 0 => AssignmentStatus::Pending->value,
                            $cursor % 11 === 0 => AssignmentStatus::Declined->value,
                            default => AssignmentStatus::Confirmed->value,
                        };

                        Assignment::create([
                            'schedule_id' => (string) $schedule->getKey(),
                            'event_id' => (string) $event->getKey(),
                            'ministry_id' => $ministryId,
                            'function_id' => $slot['function_id'],
                            'volunteer_id' => (string) $candidate->getKey(),
                            'starts_at' => $event->starts_at,
                            'status' => $status,
                            'confirmed_at' => $status === AssignmentStatus::Confirmed->value
                                ? $event->starts_at->copy()->subDays(5) : null,
                            'declined_at' => $status === AssignmentStatus::Declined->value
                                ? $event->starts_at->copy()->subDays(4) : null,
                            'decline_reason' => $status === AssignmentStatus::Declined->value
                                ? 'Compromisso de família' : null,
                            'attendance_status' => $isPast
                                ? ($cursor % 9 === 0 ? AttendanceStatus::Absent->value : AttendanceStatus::Present->value)
                                : AttendanceStatus::Pending->value,
                            'checked_in_at' => $isPast ? $event->starts_at->copy()->subMinutes(20) : null,
                            'assigned_at' => $event->starts_at->copy()->subDays(12),
                        ]);
                    }
                }
            }
        }
    }

    private function seedAbsencesAndSwaps(array $volunteers, array $ministries): void
    {
        if (Absence::count() === 0) {
            Absence::create([
                'volunteer_id' => (string) $volunteers[7]->getKey(),
                'starts_at' => now()->addDays(10)->startOfDay(),
                'ends_at' => now()->addDays(24)->endOfDay(),
                'reason' => 'Viagem a trabalho',
                'type' => 'travel',
                'status' => 'approved',
                'reviewed_at' => now()->subDays(1),
            ]);

            Absence::create([
                'volunteer_id' => (string) $volunteers[12]->getKey(),
                'starts_at' => now()->addDays(4)->startOfDay(),
                'ends_at' => now()->addDays(6)->endOfDay(),
                'reason' => 'Cirurgia agendada',
                'type' => 'health',
                'status' => 'pending',
            ]);
        }

        if (SwapRequest::count() === 0) {
            $assignment = Assignment::where('starts_at', '>=', now())->active()->first();

            if ($assignment) {
                SwapRequest::create([
                    'assignment_id' => (string) $assignment->getKey(),
                    'event_id' => (string) $assignment->event_id,
                    'ministry_id' => (string) $assignment->ministry_id,
                    'requester_volunteer_id' => (string) $assignment->volunteer_id,
                    'type' => 'replacement',
                    'reason' => 'Imprevisto no trabalho, preciso de alguém para cobrir.',
                    'responses' => [],
                    'expires_at' => $assignment->starts_at?->copy()->subHours(12),
                ]);
            }
        }
    }
}
