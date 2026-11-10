<?php

namespace App\Http\Controllers\Api;

use App\Models\AuditLog;
use App\Models\Assignment;
use App\Models\Ministry;
use App\Models\MinistryFunction;
use App\Models\Volunteer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Módulo 01 — Ministérios. */
class MinistryController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Ministry::query()->orderBy('name');

        $this->applySearch($query, $request->input('q'), ['name', 'description']);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($request->boolean('mine') && ! $request->user()->isGlobal()) {
            $query->whereIn('_id', $request->user()->ledMinistryIds());
        }

        return $this->paginate($query, $request);
    }

    public function show(string $id): JsonResponse
    {
        $ministry = Ministry::findOrFail($id);

        return response()->json([
            'item' => $ministry,
            'functions' => MinistryFunction::where('ministry_id', $id)->orderBy('order')->get(),
            'leaders' => Volunteer::whereIn('_id', $ministry->leader_ids ?? [])->get(),
            'volunteers_count' => Volunteer::where('memberships.ministry_id', $id)->count(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);

        $ministry = Ministry::create($data);

        AuditLog::record('ministry.created', $ministry, "Ministério {$ministry->name} criado");

        return $this->created($ministry, 'Ministério criado com sucesso.');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $ministry = Ministry::findOrFail($id);
        $ministry->update($this->validated($request, $id));

        AuditLog::record('ministry.updated', $ministry, "Ministério {$ministry->name} atualizado");

        return $this->updated($ministry->fresh(), 'Ministério atualizado com sucesso.');
    }

    public function destroy(string $id): JsonResponse
    {
        $ministry = Ministry::findOrFail($id);

        $openAssignments = Assignment::where('ministry_id', $id)->active()->count();

        if ($openAssignments > 0) {
            return response()->json([
                'message' => "Este ministério tem {$openAssignments} escalação(ões) em aberto. Encerre ou cancele antes de excluir.",
            ], 422);
        }

        $ministry->delete();
        MinistryFunction::where('ministry_id', $id)->delete();

        AuditLog::record('ministry.deleted', $ministry, "Ministério {$ministry->name} excluído");

        return $this->deleted('Ministério excluído com sucesso.');
    }

    private function validated(Request $request, ?string $ignoreId = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'color' => ['sometimes', 'nullable', 'string', 'max:20'],
            'icon' => ['sometimes', 'nullable', 'string', 'max:60'],
            'leader_ids' => ['sometimes', 'array'],
            'leader_ids.*' => ['string'],
            'status' => ['sometimes', 'in:active,inactive'],
            'settings' => ['sometimes', 'array'],
            'settings.confirmation_deadline_hours' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:720'],
            'settings.min_rest_days' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:90'],
            'settings.max_per_month' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:60'],
        ]);
    }
}
