<?php

namespace App\Support;

/**
 * Guarda a organização (igreja) ativa da requisição.
 * Preenchido pelo middleware ResolveOrganization e consumido pelo
 * escopo global BelongsToOrganization, de modo que nenhuma query
 * do domínio vaze dados entre igrejas.
 */
class OrganizationContext
{
    protected ?string $organizationId = null;

    public function set(?string $organizationId): void
    {
        $this->organizationId = $organizationId;
    }

    public function id(): ?string
    {
        return $this->organizationId;
    }

    public function has(): bool
    {
        return $this->organizationId !== null;
    }

    /** Executa um callback ignorando o tenant atual (uso em jobs/seeders). */
    public function withOrganization(?string $organizationId, callable $callback): mixed
    {
        $previous = $this->organizationId;
        $this->organizationId = $organizationId;

        try {
            return $callback();
        } finally {
            $this->organizationId = $previous;
        }
    }
}
