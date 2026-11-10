<?php

namespace App\Http\Controllers\Api;

use App\Models\Skill;
use App\Models\Training;
use App\Models\Volunteer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Módulo 13 — Capacitação. */
class TrainingController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Training::query()->orderBy('starts_at', 'desc');

        $this->applySearch($query, $request->input('q'), ['name', 'description', 'instructor']);

        foreach (['ministry_id', 'status'] as $filter) {
            if ($value = $request->input($filter)) {
                $query->where($filter, $value);
            }
        }

        return $this->paginate($query, $request);
    }

    public function show(string $id): JsonResponse
    {
        $training = Training::findOrFail($id);

        $participantIds = collect($training->participants ?? [])->pluck('volunteer_id')->filter()->all();

        return response()->json([
            'item' => $training,
            'skills' => Skill::whereIn('_id', $training->skill_ids ?? [])->get(),
            'volunteers' => Volunteer::whereIn('_id', $participantIds)->get(['name', 'photo_url', 'email']),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        return $this->created(Training::create($this->validated($request)), 'Capacitação criada com sucesso.');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $training = Training::findOrFail($id);
        $training->update($this->validated($request));

        return $this->updated($training->fresh(), 'Capacitação atualizada com sucesso.');
    }

    public function destroy(string $id): JsonResponse
    {
        Training::findOrFail($id)->delete();

        return $this->deleted('Capacitação excluída com sucesso.');
    }

    /**
     * Concluir a capacitação credita as habilidades no perfil de quem participou,
     * que é o que faz o módulo 13 conversar com a elegibilidade da escala.
     */
    public function complete(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'participants' => ['required', 'array'],
            'participants.*.volunteer_id' => ['required', 'string'],
            'participants.*.status' => ['required', 'in:completed,failed,absent'],
            'participants.*.score' => ['sometimes', 'nullable', 'numeric'],
            'participants.*.level' => ['sometimes', 'nullable', 'string', 'max:40'],
        ]);

        $training = Training::findOrFail($id);
        $skills = Skill::whereIn('_id', $training->skill_ids ?? [])->get();
        $credited = 0;

        foreach ($data['participants'] as $participant) {
            if ($participant['status'] !== 'completed') {
                continue;
            }

            $volunteer = Volunteer::find($participant['volunteer_id']);

            if (! $volunteer) {
                continue;
            }

            $current = collect($volunteer->skills ?? []);

            foreach ($skills as $skill) {
                $skillId = (string) $skill->getKey();
                $current = $current->reject(fn ($s) => ($s['skill_id'] ?? null) === $skillId);

                $current->push([
                    'skill_id' => $skillId,
                    'level' => $participant['level'] ?? null,
                    'certified_at' => now()->toDateString(),
                    'expires_at' => $skill->validity_months
                        ? now()->addMonths((int) $skill->validity_months)->toDateString()
                        : null,
                    'evaluated_by' => (string) $request->user()->getKey(),
                    'training_id' => $id,
                ]);
            }

            $volunteer->update(['skills' => $current->values()->all()]);
            $credited++;
        }

        $training->update([
            'participants' => $data['participants'],
            'status' => 'completed',
        ]);

        return $this->updated(
            $training->fresh(),
            "Capacitação concluída. Habilidades creditadas a {$credited} voluntário(s)."
        );
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'ministry_id' => ['sometimes', 'nullable', 'string'],
            'skill_ids' => ['sometimes', 'array'],
            'skill_ids.*' => ['string'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['sometimes', 'nullable', 'date', 'after_or_equal:starts_at'],
            'location' => ['sometimes', 'nullable', 'string', 'max:200'],
            'instructor' => ['sometimes', 'nullable', 'string', 'max:160'],
            'capacity' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:1000'],
            'participants' => ['sometimes', 'array'],
            'participants.*.volunteer_id' => ['required', 'string'],
            'participants.*.status' => ['sometimes', 'in:enrolled,completed,failed,absent'],
            'status' => ['sometimes', 'in:scheduled,running,completed,cancelled'],
        ]);
    }
}
