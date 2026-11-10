<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Coordinator = 'coordinator';
    case MinistryLeader = 'ministry_leader';
    case Volunteer = 'volunteer';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Administrador',
            self::Coordinator => 'Coordenador de escalas',
            self::MinistryLeader => 'Líder de ministério',
            self::Volunteer => 'Voluntário',
        };
    }

    /** Papéis que enxergam todos os ministérios. */
    public function isGlobal(): bool
    {
        return in_array($this, [self::Admin, self::Coordinator], true);
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
