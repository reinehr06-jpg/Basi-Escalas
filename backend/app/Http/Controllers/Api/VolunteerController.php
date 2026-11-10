<?php

namespace App\Http\Controllers\Api;

use App\Enums\VolunteerStatus;
use App\Models\Absence;
use App\Models\Assignment;
use App\Models\AuditLog;
use App\Models\Availability;
use App\Models\Ministry;
use App\Models\MinistryFunction;
use App\Models\Skill;
use App\Models\Volunteer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Módulo 03 — Voluntários. */
class VolunteerController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Volunteer::query()->orderBy('name');

        $this->applySearch($query, $request->input('q'), ['name', 'email', 'phone']);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($ministryId = $request->input('ministry_id')) {
            $query->where('memberships.ministry_id', $ministryId);
        }

        if ($functionId = $request->input('function_id')) {
            $query->where('memberships.function_ids', $functionId);
        }

        if ($skillId = $request->input('skill_id')) {
            $query->where('skills.skill_id', $skillId);
        }

        // Um líder só enxerga quem serve nos ministérios que ele lidera.
        if (! $request->user()->isGlobal()) {
            $led = $request->user()->ledMinistryIds();
            if ($led !== []) {
                $query->whereIn('memberships.ministry_id', $led);
            }
        }

        return $this->paginate($query, $request);
    }

    public function show(string $id): JsonResponse
    {
        $volunteer = Volunteer::findOrFail($id);

        $ministryIds = $volunteer->ministryIds();

        return response()->json([
            'item' => $volunteer,
            'ministries' => Ministry::whereIn('_id', $ministryIds)->get(),
            'functions' => MinistryFunction::whereIn('ministry_id', $ministryIds)->orderBy('order')->get(),
            'skills' => Skill::whereIn('_id', $volunteer->skillIds())->get(),
            'availabilities' => Availability::where('volunteer_id', $id)->orderBy('weekday')->get(),
            'absences' => Absence::where('volunteer_id', $id)->orderBy('starts_at', 'desc')->limit(20)->get(),
            'stats' => $this->stats($id),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $volunteer = Volunteer::create($this->validated($request));

        AuditLog::record('volunteer.created', $volunteer, "Voluntário {$volunteer->name} cadastrado");

        return $this->created($volunteer, 'Voluntário cadastrado com sucesso.');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $volunteer = Volunteer::findOrFail($id);
        $volunteer->update($this->validated($request));

        AuditLog::record('volunteer.updated', $volunteer, "Voluntário {$volunteer->name} atualizado");

        return $this->updated($volunteer->fresh(), 'Voluntário atualizado com sucesso.');
    }

    public function destroy(string $id): JsonResponse
    {
        $volunteer = Volunteer::findOrFail($id);

        $open = Assignment::where('volunteer_id', $id)
            ->active()
            ->where('starts_at', '>=', now())
            ->count();

        if ($open > 0) {
            return response()->json([
                'message' => "Este voluntário tem {$open} escalação(ões) futura(s). Remova-o das escalas antes de excluir.",
            ], 422);
        }

        $volunteer->delete();

        AuditLog::record('volunteer.deleted', $volunteer, "Voluntário {$volunteer->name} excluído");

        return $this->deleted('Voluntário excluído com sucesso.');
    }

    /** Histórico de escalas do voluntário. */
    public function history(Request $request, string $id): JsonResponse
    {
        $volunteer = Volunteer::findOrFail($id);

        $query = Assignment::where('volunteer_id', $volunteer->getKey())
            ->orderBy('starts_at', 'desc');

        if ($from = $request->input('from')) {
            $query->where('starts_at', '>=', $from);
        }

        if ($to = $request->input('to')) {
            $query->where('starts_at', '<=', $to);
        }

        return $this->paginate($query, $request);
    }

    /**
     * Importação em lote. Casa pelo external_ref.id e, na falta dele, pelo e-mail,
     * de modo que rodar a importação duas vezes não duplica ninguém.
     */
    public function import(Request $request): JsonResponse
    {
        $data = $request->validate([
            'source' => ['required', 'string', 'max:60'],
            'items' => ['required', 'array', 'min:1', 'max:1000'],
            'items.*.name' => ['required', 'string', 'max:160'],
            'items.*.email' => ['sometimes', 'nullable', 'email', 'max:160'],
            'items.*.phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'items.*.external_id' => ['sometimes', 'nullable', 'string', 'max:120'],
            'items.*.birth_date' => ['sometimes', 'nullable', 'date'],
            'items.*.ministry_id' => ['sometimes', 'nullable', 'string'],
        ]);

        $created = 0;
        $updated = 0;
        $skipped = [];

        foreach ($data['items'] as $index => $item) {
            $existing = null;

            if (! empty($item['external_id'])) {
                $existing = Volunteer::where('external_ref.source', $data['source'])
                    ->where('external_ref.id', (string) $item['external_id'])
                    ->first();
            }

            if (! $existing && ! empty($item['email'])) {
                $existing = Volunteer::where('email', strtolower($item['email']))->first();
            }

            $payload = array_filter([
                'name' => $item['name'],
                'email' => isset($item['email']) ? strtolower($item['email']) : null,
                'phone' => $item['phone'] ?? null,
                'birth_date' => $item['birth_date'] ?? null,
            ], fn ($value) => $value !== null);

            $payload['external_ref'] = [
                'source' => $data['source'],
                'id' => isset($item['external_id']) ? (string) $item['external_id'] : null,
                'synced_at' => now()->toIso8601String(),
            ];

            if ($existing) {
                $existing->update($payload);
                $volunteer = $existing;
                $updated++;
            } else {
                $volunteer = Volunteer::create($payload);
                $created++;
            }

            if (! empty($item['ministry_id'])) {
                $this->attachMinistry($volunteer, (string) $item['ministry_id']);
            }
        }

        AuditLog::record('volunteer.imported', null, "Importação de voluntários ({$data['source']}): {$created} criados, {$updated} atualizados");

        return response()->json([
            'message' => "Importação concluída: {$created} criado(s), {$updated} atualizado(s).",
            'created' => $created,
            'updated' => $updated,
            'skipped' => $skipped,
        ]);
    }

    private function attachMinistry(Volunteer $volunteer, string $ministryId): void
    {
        $memberships = collect($volunteer->memberships ?? []);

        if ($memberships->contains(fn ($m) => ($m['ministry_id'] ?? null) === $ministryId)) {
            return;
        }

        $memberships->push([
            'ministry_id' => $ministryId,
            'function_ids' => [],
            'is_leader' => false,
            'since' => now()->toDateString(),
        ]);

        $volunteer->update(['memberships' => $memberships->values()->all()]);
    }

    private function stats(string $volunteerId): array
    {
        $base = fn () => Assignment::where('volunteer_id', $volunteerId);

        return [
            'total' => $base()->count(),
            'upcoming' => $base()->active()->where('starts_at', '>=', now())->count(),
            'confirmed' => $base()->where('status', 'confirmed')->count(),
            'declined' => $base()->where('status', 'declined')->count(),
            'present' => $base()->where('attendance_status', 'present')->count(),
            'absent' => $base()->where('attendance_status', 'absent')->count(),
            'last_served_at' => $base()->where('attendance_status', 'present')
                ->orderBy('starts_at', 'desc')->first()?->starts_at,
        ];
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'email' => ['sometimes', 'nullable', 'email', 'max:160'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'birth_date' => ['sometimes', 'nullable', 'date'],
            'gender' => ['sometimes', 'nullable', 'in:male,female,other'],
            'photo_url' => ['sometimes', 'nullable', 'string', 'max:500'],
            'status' => ['sometimes', 'in:'.implode(',', VolunteerStatus::values())],
            'joined_at' => ['sometimes', 'nullable', 'date'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'external_ref' => ['sometimes', 'nullable', 'array'],

            'memberships' => ['sometimes', 'array'],
            'memberships.*.ministry_id' => ['required', 'string'],
            'memberships.*.function_ids' => ['sometimes', 'array'],
            'memberships.*.function_ids.*' => ['string'],
            'memberships.*.is_leader' => ['sometimes', 'boolean'],
            'memberships.*.since' => ['sometimes', 'nullable', 'date'],

            'skills' => ['sometimes', 'array'],
            'skills.*.skill_id' => ['required', 'string'],
            'skills.*.level' => ['sometimes', 'nullable', 'string', 'max:40'],
            'skills.*.certified_at' => ['sometimes', 'nullable', 'date'],
            'skills.*.expires_at' => ['sometimes', 'nullable', 'date'],

            'preferences' => ['sometimes', 'array'],
            'preferences.max_per_month' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:60'],
            'preferences.min_rest_days' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:90'],
            'preferences.preferred_weekdays' => ['sometimes', 'array'],
            'preferences.preferred_weekdays.*' => ['integer', 'min:0', 'max:6'],
        ]);
    }
}
