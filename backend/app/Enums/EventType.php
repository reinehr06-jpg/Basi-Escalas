<?php

namespace App\Enums;

enum EventType: string
{
    case Service = 'service';
    case Rehearsal = 'rehearsal';
    case Event = 'event';
    case Meeting = 'meeting';
    case Other = 'other';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
