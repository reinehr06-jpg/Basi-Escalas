<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\ExposesObjectId;
use MongoDB\Laravel\Eloquent\Model;

/** Módulo 16 — Configurações e automações, uma chave por documento. */
class Setting extends Model
{
    use BelongsToOrganization;
    use ExposesObjectId;

    protected $connection = 'mongodb';
    protected $collection = 'settings';

    protected $fillable = [
        'organization_id',
        'key',
        'value',
        'group',
        'description',
    ];


    /**
     * Nomes diferentes de `value`/`get`: o Eloquent resolve `$model->value`
     * procurando um método homônimo e chamaria o helper sem argumentos.
     */
    public static function read(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();

        return $setting?->value['data'] ?? $default;
    }

    public static function write(string $key, mixed $value, string $group = 'general'): self
    {
        return static::updateOrCreate(
            ['key' => $key],
            ['value' => ['data' => $value], 'group' => $group],
        );
    }
}
