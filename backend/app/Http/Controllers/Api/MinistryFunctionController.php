<?php

namespace App\Http\Controllers\Api;

use App\Models\Assignment;
use App\Models\AuditLog;
use App\Models\Ministry;
use App\Models\MinistryFunction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Módulo 02 — Funções. */
class MinistryFunctionController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = MinistryFunction::query()->orderBy('order')->orderBy('name');

        $this->applySearch($query, $request->input('q'), ['name', 'description']);

        if ($ministryId = $request->input('ministry_id')) {
            $query->where('ministry_id', $ministryId);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        return $this->paginate($query, $request);
    }

    public function show(string $id): JsonResponse
    {
        $function = MinistryFunction::findOrFail($id);

        return response()->json([
            'item' => $function,
            'ministry' => Ministry::find($function->ministry_id),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $function = MinistryFunction::create($this->validated($request));

        AuditLog::record('function.created', $function, "Função {$function->name} criada");

        return $this->created($function, 'Função criada com sucesso.');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $function = MinistryFunction::findOrFail($id);
        $function->update($this->validated($request));

        AuditLog::record('function.updated', $function, "Função {$function->name} atualizada");

        return $this->updated($function->fresh(), 'Função atualizada com sucesso.');
    }

    public function destroy(string $id): JsonResponse
    {
        $function = MinistryFunction::findOrFail($id);

        $open = Assignment::where('function_id', $id)->active()->count();

        if ($open > 0) {
            return response()->json([
                'message' => "Esta função tem {$open} escalação(ões) em aberto e não pode ser excluída.",
            ], 422);
        }

        $function->delete();

        AuditLog::record('function.deleted', $function, "Função {$function->name} excluída");

        return $this->deleted('Função excluída com sucesso.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'ministry_id' => ['required', 'string'],
            'name' => ['required', 'string', 'max:120'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'color' => ['sometimes', 'nullable', 'string', 'max:20'],
            'required_skill_ids' => ['sometimes', 'array'],
            'required_skill_ids.*' => ['string'],
            'default_quantity' => ['sometimes', 'integer', 'min:1', 'max:200'],
            'min_quantity' => ['sometimes', 'integer', 'min:0', 'max:200'],
            'max_quantity' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:200'],
            'is_leadership' => ['sometimes', 'boolean'],
            'order' => ['sometimes', 'integer', 'min:0'],
            'status' => ['sometimes', 'in:active,inactive'],
        ]);
    }
}
