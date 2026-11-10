<?php

namespace App\Http\Controllers\Api;

use App\Models\MinistryFunction;
use App\Models\Skill;
use App\Models\Volunteer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Módulo 13 — Habilidades. */
class SkillController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Skill::query()->orderBy('name');

        $this->applySearch($query, $request->input('q'), ['name', 'description', 'category']);

        foreach (['ministry_id', 'category', 'status'] as $filter) {
            if ($value = $request->input($filter)) {
                $query->where($filter, $value);
            }
        }

        return $this->paginate($query, $request);
    }

    public function show(string $id): JsonResponse
    {
        $skill = Skill::findOrFail($id);

        return response()->json([
            'item' => $skill,
            'volunteers' => Volunteer::where('skills.skill_id', $id)->get(['name', 'photo_url', 'skills']),
            'functions' => MinistryFunction::where('required_skill_ids', $id)->get(['name', 'ministry_id']),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        return $this->created(Skill::create($this->validated($request)), 'Habilidade criada com sucesso.');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $skill = Skill::findOrFail($id);
        $skill->update($this->validated($request));

        return $this->updated($skill->fresh(), 'Habilidade atualizada com sucesso.');
    }

    public function destroy(string $id): JsonResponse
    {
        $inUse = MinistryFunction::where('required_skill_ids', $id)->count();

        if ($inUse > 0) {
            return response()->json([
                'message' => "Esta habilidade é exigida por {$inUse} função(ões) e não pode ser excluída.",
            ], 422);
        }

        Skill::findOrFail($id)->delete();

        return $this->deleted('Habilidade excluída com sucesso.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'category' => ['sometimes', 'nullable', 'string', 'max:60'],
            'ministry_id' => ['sometimes', 'nullable', 'string'],
            'levels' => ['sometimes', 'array'],
            'levels.*' => ['string', 'max:40'],
            'requires_certification' => ['sometimes', 'boolean'],
            'validity_months' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:120'],
            'status' => ['sometimes', 'in:active,inactive'],
        ]);
    }
}
