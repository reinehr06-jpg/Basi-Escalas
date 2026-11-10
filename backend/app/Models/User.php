<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\ExposesObjectId;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use MongoDB\Laravel\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use BelongsToOrganization;
    use ExposesObjectId;
    use HasApiTokens;
    use Notifiable;
    use SoftDeletes;

    protected $connection = 'mongodb';
    protected $collection = 'users';

    protected $fillable = [
        'organization_id',
        'volunteer_id',
        'name',
        'email',
        'password',
        'role',
        'status',
        'phone',
        'avatar_url',
        'locale',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
        ];
    }

    protected $attributes = [
        'status' => 'active',
        'role' => 'volunteer',
    ];

    public function volunteer()
    {
        return $this->belongsTo(Volunteer::class);
    }

    public function isGlobal(): bool
    {
        return $this->role instanceof UserRole && $this->role->isGlobal();
    }

    /** Ministérios que o usuário lidera (vazio para papéis globais). */
    public function ledMinistryIds(): array
    {
        if ($this->isGlobal()) {
            return [];
        }

        return Ministry::where('leader_ids', $this->volunteer_id)
            ->get()
            ->map(fn ($ministry) => (string) $ministry->getKey())
            ->all();
    }
}
