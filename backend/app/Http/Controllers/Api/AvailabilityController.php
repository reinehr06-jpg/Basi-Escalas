<?php

namespace App\Http\Controllers\Api;

use App\Models\Availability;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Módulo 07 — Disponibilidade recorrente. */
class AvailabilityController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Availability::query()->orderBy('weekday')->orderBy('start_time');

        if ($volunteerId = $this->resolveVolunteerId($request)) {
            $query->where('volunteer_id', $volunteerId);
        }

        if ($ministryId = $request->input('ministry_id')) {
            $query->where('ministry_id', $ministryId);
        }

        return response()->json(['data' => $query->get()]);
    }

    /** Substitui a grade inteira do voluntário: é como a tela edita. */
    public function sync(Request $request): JsonResponse
    {
        $data = $request->validate([
            'volunteer_id' => ['required', 'string'],
            'items' => ['present', 'array'],
            'items.*.weekday' => ['required', 'integer', 'min:0', 'max:6'],
            'items.*.start_time' => ['sometimes', 'nullable', 'string', 'max:5'],
            'items.*.end_time' => ['sometimes', 'nullable', 'string', 'max:5'],
            'items.*.is_available' => ['sometimes', 'boolean'],
            'items.*.ministry_id' => ['sometimes', 'nullable', 'string'],
            'items.*.note' => ['sometimes', 'nullable', 'string', 'max:300'],
        ]);

        $this->guardOwnership($request, $data['volunteer_id']);

        Availability::where('volunteer_id', $data['volunteer_id'])->forceDelete();

        foreach ($data['items'] as $item) {
            Availability::create(array_merge($item, ['volunteer_id' => $data['volunteer_id']]));
        }

        return response()->json([
            'message' => 'Disponibilidade atualizada.',
            'data' => Availability::where('volunteer_id', $data['volunteer_id'])->orderBy('weekday')->get(),
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $availability = Availability::findOrFail($id);
        $this->guardOwnership($request, (string) $availability->volunteer_id);
        $availability->delete();

        return $this->deleted('Disponibilidade removida.');
    }

    private function resolveVolunteerId(Request $request): ?string
    {
        if ($id = $request->input('volunteer_id')) {
            return (string) $id;
        }

        return $request->user()->volunteer_id ? (string) $request->user()->volunteer_id : null;
    }

    private function guardOwnership(Request $request, string $volunteerId): void
    {
        $user = $request->user();

        if ($user->isGlobal()) {
            return;
        }

        abort_unless(
            $user->volunteer_id && (string) $user->volunteer_id === $volunteerId,
            403,
            'Você só pode alterar a própria disponibilidade.'
        );
    }
}
