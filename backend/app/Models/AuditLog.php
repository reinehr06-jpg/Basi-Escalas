<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\ExposesObjectId;
use MongoDB\Laravel\Eloquent\Model;

/** Trilha de auditoria das ações sensíveis (publicação, troca, exclusão). */
class AuditLog extends Model
{
    use BelongsToOrganization;
    use ExposesObjectId;

    protected $connection = 'mongodb';
    protected $collection = 'audit_logs';

    public $timestamps = true;

    protected $fillable = [
        'organization_id',
        'user_id',
        'user_name',
        'action',
        'subject_type',
        'subject_id',
        'description',
        'changes',
        'ip',
    ];


    public static function record(string $action, ?object $subject = null, string $description = '', array $changes = []): void
    {
        $user = auth()->user();

        static::create([
            'user_id' => $user?->getKey(),
            'user_name' => $user?->name,
            'action' => $action,
            'subject_type' => $subject ? class_basename($subject) : null,
            'subject_id' => $subject?->getKey(),
            'description' => $description,
            'changes' => $changes,
            'ip' => request()->ip(),
        ]);
    }
}
