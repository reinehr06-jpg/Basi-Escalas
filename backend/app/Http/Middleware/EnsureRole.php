<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        $role = $user?->role?->value ?? $user?->role;

        if (! $user || ! in_array($role, $roles, true)) {
            return response()->json([
                'message' => 'Você não tem permissão para executar esta ação.',
            ], 403);
        }

        return $next($request);
    }
}
