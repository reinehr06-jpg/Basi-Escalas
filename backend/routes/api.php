<?php

use App\Http\Controllers\Api\AbsenceController;
use App\Http\Controllers\Api\AssignmentController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AvailabilityController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\MeController;
use App\Http\Controllers\Api\MinistryController;
use App\Http\Controllers\Api\MinistryFunctionController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\SkillController;
use App\Http\Controllers\Api\SwapRequestController;
use App\Http\Controllers\Api\SystemUserController;
use App\Http\Controllers\Api\TrainingController;
use App\Http\Controllers\Api\VolunteerController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API — Basi Escalas
|--------------------------------------------------------------------------
| Papéis: admin e coordinator enxergam tudo; ministry_leader fica restrito
| aos ministérios que lidera; volunteer só age sobre a própria agenda.
*/

// Sonda do container: responde 200 só quando o Mongo também responde.
Route::get('health', function () {
    try {
        DB::connection('mongodb')->getDatabase()->command(['ping' => 1]);
        $database = 'up';
        $error = null;
    } catch (\Throwable $e) {
        $database = 'down';
        $error = $e->getMessage();
    }

    return response()->json(array_filter([
        'status' => $database === 'up' ? 'ok' : 'degraded',
        'database' => $database,
        'time' => now()->toIso8601String(),
        'error' => config('app.debug') ? $error : null,
    ]), $database === 'up' ? 200 : 503);
});

Route::post('auth/login', [AuthController::class, 'login']);
Route::post('auth/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    // Módulo 15 — painel do voluntário
    Route::get('me/dashboard', [MeController::class, 'dashboard']);
    Route::get('me/assignments', [MeController::class, 'assignments']);

    // Módulo 06 — dashboard da coordenação
    Route::get('dashboard/summary', [DashboardController::class, 'summary']);

    // Módulo 01 — ministérios
    Route::apiResource('ministries', MinistryController::class);

    // Módulo 02 — funções
    Route::apiResource('functions', MinistryFunctionController::class);

    // Módulo 03 — voluntários
    Route::post('volunteers/import', [VolunteerController::class, 'import']);
    Route::get('volunteers/{volunteer}/history', [VolunteerController::class, 'history']);
    Route::apiResource('volunteers', VolunteerController::class);

    // Módulo 04 — calendário
    Route::post('events/{event}/cancel', [EventController::class, 'cancel']);
    Route::apiResource('events', EventController::class);

    // Módulo 05 — escalas
    Route::get('schedules/{schedule}/candidates', [ScheduleController::class, 'candidates']);
    Route::post('schedules/{schedule}/publish', [ScheduleController::class, 'publish']);
    Route::post('schedules/{schedule}/close', [ScheduleController::class, 'close']);
    Route::post('schedules/{schedule}/duplicate', [ScheduleController::class, 'duplicate']);
    Route::post('schedules/{schedule}/autofill', [ScheduleController::class, 'autofill']);
    Route::apiResource('schedules', ScheduleController::class);

    // Módulos 08 e 10 — confirmações e presenças
    Route::post('assignments/bulk-checkin', [AssignmentController::class, 'bulkCheckin']);
    Route::post('assignments/{assignment}/confirm', [AssignmentController::class, 'confirm']);
    Route::post('assignments/{assignment}/decline', [AssignmentController::class, 'decline']);
    Route::post('assignments/{assignment}/checkin', [AssignmentController::class, 'checkin']);
    Route::apiResource('assignments', AssignmentController::class)->except(['show']);

    // Módulo 07 — disponibilidade e ausências
    Route::get('availabilities', [AvailabilityController::class, 'index']);
    Route::post('availabilities/sync', [AvailabilityController::class, 'sync']);
    Route::delete('availabilities/{availability}', [AvailabilityController::class, 'destroy']);
    Route::post('absences/{absence}/review', [AbsenceController::class, 'review'])
        ->middleware('role:admin,coordinator,ministry_leader');
    Route::apiResource('absences', AbsenceController::class)->except(['show']);

    // Módulo 09 — trocas e substituições
    Route::get('swaps/{swap}/candidates', [SwapRequestController::class, 'candidates']);
    Route::post('swaps/{swap}/accept', [SwapRequestController::class, 'accept']);
    Route::post('swaps/{swap}/decline', [SwapRequestController::class, 'decline']);
    Route::post('swaps/{swap}/cancel', [SwapRequestController::class, 'cancel']);
    Route::post('swaps/{swap}/review', [SwapRequestController::class, 'review'])
        ->middleware('role:admin,coordinator,ministry_leader');
    Route::apiResource('swaps', SwapRequestController::class)->only(['index', 'show', 'store']);

    // Módulo 13 — habilidades e capacitação
    Route::apiResource('skills', SkillController::class);
    Route::post('trainings/{training}/complete', [TrainingController::class, 'complete']);
    Route::apiResource('trainings', TrainingController::class);

    // Módulo 14 — relatórios
    Route::prefix('reports')->group(function () {
        Route::get('volunteers', [ReportController::class, 'volunteers']);
        Route::get('ministries', [ReportController::class, 'ministries']);
        Route::get('attendance', [ReportController::class, 'attendance']);
        Route::get('swaps', [ReportController::class, 'swaps']);
    });

    // Módulo 16 — configurações, automações e usuários
    Route::middleware('role:admin,coordinator')->group(function () {
        Route::get('settings', [SettingController::class, 'index']);
        Route::put('settings', [SettingController::class, 'update']);
        Route::put('settings/organization', [SettingController::class, 'organization']);
        Route::get('audit-logs', [AuditLogController::class, 'index']);
        Route::get('system-users/roles', [SystemUserController::class, 'roles']);
        Route::apiResource('system-users', SystemUserController::class);
    });
});
