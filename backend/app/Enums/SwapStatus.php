<?php

namespace App\Enums;

enum SwapStatus: string
{
    case Open = 'open';
    case Accepted = 'accepted';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Cancelled = 'cancelled';
    case Expired = 'expired';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
