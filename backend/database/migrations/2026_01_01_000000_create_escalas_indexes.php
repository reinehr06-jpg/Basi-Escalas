<?php

use Illuminate\Database\Migrations\Migration;
use MongoDB\Laravel\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * No Mongo não há DDL de tabelas — o que precisa existir são os índices
 * que sustentam as consultas quentes do sistema (agenda por período,
 * escala de um evento, agenda de um voluntário).
 */
return new class extends Migration
{
    public function up(): void
    {
        $schema = Schema::connection('mongodb');

        $schema->create('organizations', function (Blueprint $collection) {
            $collection->unique('slug');
        });

        $schema->create('users', function (Blueprint $collection) {
            $collection->unique('email');
            $collection->index('organization_id');
            $collection->index(['organization_id', 'role']);
            $collection->index('volunteer_id');
        });

        $schema->create('personal_access_tokens', function (Blueprint $collection) {
            $collection->unique('token');
            $collection->index(['tokenable_id', 'tokenable_type']);
        });

        $schema->create('ministries', function (Blueprint $collection) {
            $collection->index(['organization_id', 'status']);
            $collection->index('leader_ids');
        });

        $schema->create('functions', function (Blueprint $collection) {
            $collection->index(['organization_id', 'ministry_id', 'status']);
        });

        $schema->create('volunteers', function (Blueprint $collection) {
            $collection->index(['organization_id', 'status']);
            $collection->index('memberships.ministry_id');
            $collection->index('memberships.function_ids');
            $collection->index('skills.skill_id');
            $collection->index('external_ref.id');
            $collection->index('email');
        });

        $schema->create('events', function (Blueprint $collection) {
            $collection->index(['organization_id', 'starts_at']);
            $collection->index(['organization_id', 'status', 'starts_at']);
            $collection->index('series_id');
            $collection->index('ministry_ids');
        });

        $schema->create('schedules', function (Blueprint $collection) {
            $collection->index(['organization_id', 'event_id', 'ministry_id']);
            $collection->index(['organization_id', 'status']);
        });

        $schema->create('assignments', function (Blueprint $collection) {
            $collection->index(['organization_id', 'schedule_id']);
            $collection->index(['organization_id', 'event_id', 'volunteer_id']);
            $collection->index(['organization_id', 'volunteer_id', 'starts_at']);
            $collection->index(['organization_id', 'ministry_id', 'starts_at']);
            $collection->index(['organization_id', 'status']);
            $collection->index('attendance_status');
        });

        $schema->create('availabilities', function (Blueprint $collection) {
            $collection->index(['organization_id', 'volunteer_id', 'weekday']);
        });

        $schema->create('absences', function (Blueprint $collection) {
            $collection->index(['organization_id', 'volunteer_id', 'starts_at']);
            $collection->index(['organization_id', 'status']);
        });

        $schema->create('swap_requests', function (Blueprint $collection) {
            $collection->index(['organization_id', 'status']);
            $collection->index(['organization_id', 'ministry_id', 'status']);
            $collection->index('assignment_id');
            $collection->index('requester_volunteer_id');
        });

        $schema->create('skills', function (Blueprint $collection) {
            $collection->index(['organization_id', 'status']);
            $collection->index('ministry_id');
        });

        $schema->create('trainings', function (Blueprint $collection) {
            $collection->index(['organization_id', 'starts_at']);
            $collection->index('participants.volunteer_id');
        });

        $schema->create('settings', function (Blueprint $collection) {
            $collection->index(['organization_id', 'key']);
        });

        $schema->create('audit_logs', function (Blueprint $collection) {
            $collection->index(['organization_id', 'created_at']);
            $collection->index(['organization_id', 'action']);
            $collection->index('subject_id');
        });
    }

    public function down(): void
    {
        $schema = Schema::connection('mongodb');

        foreach ([
            'organizations', 'users', 'personal_access_tokens', 'ministries', 'functions',
            'volunteers', 'events', 'schedules', 'assignments', 'availabilities',
            'absences', 'swap_requests', 'skills', 'trainings', 'settings', 'audit_logs',
        ] as $collection) {
            $schema->dropIfExists($collection);
        }
    }
};
