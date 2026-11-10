<?php

namespace App\Enums;

enum VolunteerStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case OnLeave = 'on_leave';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
