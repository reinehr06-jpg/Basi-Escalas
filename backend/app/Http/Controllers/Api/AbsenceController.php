<?php

namespace App\Http\Controllers\Api;

use App\Enums\AbsenceStatus;
use App\Enums\AssignmentStatus;
use App\Models\Absence;
use App\Models\Assignment;
use App\Models\AuditLog;
use App\Models\Volunteer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Módulo 07 — Ausências e afastamentos. */
class AbsenceController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Absence::query()->orderBy('starts_at', 'desc');

        foreach (['volunteer_id', 'status', 'type'] as $filter) {
            if ($value = $request->input($filter)) {
                $query->where($filter, $value);
            }
        }

        if ($request->boolean('mine') && $request->user()->volunteer_id) {
            $query->where('volunteer_id', (string) $request->user()->volunteer_id);
        }

        if ($from = $request->input('from')) {
            $query->where('ends_at', '>=', $from);
        }

        if ($to = $request->input('to')) {
            $query->where('starts_at', '<=', $to);
        }

        $perPage = max(1, min((int) ($request->input('itemsPerPage') ?? 10), 200));
        $paginator = $query->paginate($perPage, ['*'], 'page', max(1, (int) ($request->input('page') ?? 1)));

        $volunteers = Volunteer::whereIn('_id', collect($paginator->items())->pluck('volunteer_id')->filter()->all())
            ->get()->keyBy(fn ($v) => (string) $v->getKey());

        $paginator->through(fn (Absence $absence) => $absence->toArray() + [
            'volunteer_name' => $volunteers[(string) $absence->volunteer_id]->name ?? null,
            'volunteer_photo_url' => $volunteers[(string) $absence->volunteer_id]->photo_url ?? null,
        ]);

        return response()->json($paginator);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'volunteer_id' => ['required', 'string'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after_or_equal:starts_at'],
            'reason' => ['required', 'string', 'max:500'],
            'type' => ['sometimes', 'in:personal,health,travel,study,work,other'],
        ]);

        $user = $request->user();

        if (! $user->isGlobal() && (string) $user->volunteer_id !== $data['volunteer_id']) {
            abort(403, 'Você só pode registrar a própria ausência.');
        }

        // Coordenação lança ausência já aprovada; voluntário entra como pendente.
        $absence = Absence::create($data + [
            'status' => $user->isGlobal() ? AbsenceStatus::Approved->value : AbsenceStatus::Pending->value,
            'reviewed_by' => $user->isGlobal() ? $user->getKey() : null,
            'reviewed_at' => $user->isGlobal() ? now() : null,
        ]);

        if ($absence->status === AbsenceStatus::Approved) {
            $this->releaseAssignments($absence);
        }

        return $this->created($absence, 'Ausência registrada.');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $absence = Absence::findOrFail($id);

        $data = $request->validate([
            'starts_at' => ['sometimes', 'date'],
            'ends_at' => ['sometimes', 'date', 'after_or_equal:starts_at'],
            'reason' => ['sometimes', 'string', 'max:500'],
            'type' => ['sometimes', 'in:personal,health,travel,study,work,other'],
        ]);

        $absence->update($data);

        return $this->updated($absence->fresh(), 'Ausência atualizada.');
    }

    public function review(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'review_note' => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        $absence = Absence::findOrFail($id);

        $absence->update([
            'status' => $data['status'],
            'review_note' => $data['review_note'] ?? null,
            'reviewed_by' => $request->user()->getKey(),
            'reviewed_at' => now(),
        ]);

        $released = 0;

        if ($absence->status === AbsenceStatus::Approved) {
            $released = $this->releaseAssignments($absence);
        }

        $volunteer = Volunteer::find($absence->volunteer_id);

        AuditLog::record('absence.reviewed', $absence, "Ausência de {$volunteer?->name} marcada como {$data['status']}");

        return $this->updated(
            $absence->fresh(),
            $released > 0
                ? "Ausência aprovada. {$released} escalação(ões) no período ficaram em aberto."
                : 'Ausência atualizada.'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Absence::findOrFail($id)->delete();

        return $this->deleted('Ausência removida.');
    }

    /** Aprovar ausência libera as vagas do período, sem apagar o histórico. */
    private function releaseAssignments(Absence $absence): int
    {
        $assignments = Assignment::where('volunteer_id', (string) $absence->volunteer_id)
            ->active()
            ->where('starts_at', '>=', $absence->starts_at)
            ->where('starts_at', '<=', $absence->ends_at)
            ->get();

        foreach ($assignments as $assignment) {
            $assignment->update([
                'status' => AssignmentStatus::Declined->value,
                'declined_at' => now(),
                'decline_reason' => 'Ausência aprovada: '.$absence->reason,
            ]);
        }

        return $assignments->count();
    }
}
