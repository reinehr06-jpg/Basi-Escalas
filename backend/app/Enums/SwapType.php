<?php

namespace App\Enums;

/** Troca = duas pessoas invertem escalas. Substituição = alguém assume a vaga. */
enum SwapType: string
{
    case Swap = 'swap';
    case Replacement = 'replacement';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
