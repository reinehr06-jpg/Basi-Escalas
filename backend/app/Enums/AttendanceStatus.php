<?php

namespace App\Enums;

enum AttendanceStatus: string
{
    case Pending = 'pending';
    case Present = 'present';
    case Late = 'late';
    case Absent = 'absent';
    case Justified = 'justified';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
