<?php

namespace App\Http\Middleware;

use App\Support\OrganizationContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Fixa a organização do usuário autenticado no contexto da requisição.
 * Sem isso o escopo global não filtra e uma igreja veria dados de outra.
 */
class ResolveOrganization
{
    public function __construct(private OrganizationContext $context)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->organization_id) {
            $this->context->set((string) $user->organization_id);
        }

        return $next($request);
    }
}
