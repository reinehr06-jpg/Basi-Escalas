<?php

namespace App\Http\Controllers\Api;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

abstract class ApiController extends Controller
{
    /**
     * Pagina no mesmo formato que o front já consome
     * (data / total / current_page / per_page / last_page).
     */
    protected function paginate(Builder $query, Request $request): JsonResponse
    {
        $perPage = (int) ($request->input('itemsPerPage') ?? $request->input('per_page') ?? 10);
        $perPage = max(1, min($perPage, 200));

        $page = (int) ($request->input('page') ?? 1);

        return response()->json(
            $query->paginate($perPage, ['*'], 'page', max(1, $page))
        );
    }

    /** Busca textual simples em um conjunto de campos. */
    protected function applySearch(Builder $query, ?string $term, array $fields): Builder
    {
        $term = trim((string) $term);

        if ($term === '' || $fields === []) {
            return $query;
        }

        return $query->where(function (Builder $inner) use ($term, $fields) {
            foreach ($fields as $field) {
                $inner->orWhere($field, 'like', "%{$term}%");
            }
        });
    }

    protected function created(mixed $item, string $message): JsonResponse
    {
        return response()->json(['message' => $message, 'item' => $item], 201);
    }

    protected function updated(mixed $item, string $message): JsonResponse
    {
        return response()->json(['message' => $message, 'item' => $item]);
    }

    protected function deleted(string $message): JsonResponse
    {
        return response()->json(['message' => $message]);
    }
}
