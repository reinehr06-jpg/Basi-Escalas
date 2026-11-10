<?php

namespace App\Models;

use App\Models\Concerns\ExposesObjectId;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Igreja / instituição dona dos dados. Todo o restante do domínio é
 * isolado por organization_id.
 */
class Organization extends Model
{
    use SoftDeletes;
    use ExposesObjectId;

    protected $connection = 'mongodb';
    protected $collection = 'organizations';

    protected $fillable = [
        'name',
        'slug',
        'document',
        'email',
        'phone',
        'timezone',
        'locale',
        'logo_url',
        'address',
        'settings',
        'status',
    ];


    protected $attributes = [
        'timezone' => 'America/Sao_Paulo',
        'locale' => 'pt-BR',
        'status' => 'active',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function ministries()
    {
        return $this->hasMany(Ministry::class);
    }
}
