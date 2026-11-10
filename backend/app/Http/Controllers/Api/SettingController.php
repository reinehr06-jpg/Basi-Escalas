<?php

namespace App\Http\Controllers\Api;

use App\Models\AuditLog;
use App\Models\Organization;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Módulo 16 — Configurações e automações. */
class SettingController extends ApiController
{
    /** Padrões aplicados quando a igreja ainda não configurou nada. */
    public const DEFAULTS = [
        'scheduling.confirmation_deadline_hours' => 48,
        'scheduling.min_rest_days' => 7,
        'scheduling.max_per_month' => 6,
        'scheduling.allow_self_swap' => true,
        'scheduling.require_leader_approval_on_swap' => true,
        'scheduling.block_without_required_skill' => false,
        'automation.reminder_offsets_hours' => [72, 24, 3],
        'automation.auto_close_schedule_after_hours' => 24,
        'automation.auto_release_on_absence' => true,
        'automation.escalate_unconfirmed_hours' => 24,
        'checkin.open_minutes_before' => 60,
        'checkin.allow_self_checkin' => false,
        'checkin.mark_absent_after_minutes' => 30,
    ];

    public function index(): JsonResponse
    {
        $stored = Setting::all()->keyBy('key');

        $values = [];

        foreach (self::DEFAULTS as $key => $default) {
            $setting = $stored->get($key);

            $values[] = [
                'key' => $key,
                'group' => explode('.', $key)[0],
                'value' => $setting?->value['data'] ?? $default,
                'default' => $default,
                'is_custom' => $setting !== null,
            ];
        }

        return response()->json([
            'data' => $values,
            'organization' => Organization::find(auth()->user()->organization_id),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'settings' => ['required', 'array'],
        ]);

        $saved = 0;

        foreach ($data['settings'] as $key => $value) {
            if (! array_key_exists($key, self::DEFAULTS)) {
                continue;
            }

            Setting::write($key, $value, explode('.', $key)[0]);
            $saved++;
        }

        AuditLog::record('settings.updated', null, "{$saved} configuração(ões) atualizada(s)");

        return response()->json([
            'message' => 'Configurações salvas.',
            'saved' => $saved,
        ]);
    }

    public function organization(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:160'],
            'email' => ['sometimes', 'nullable', 'email', 'max:160'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'document' => ['sometimes', 'nullable', 'string', 'max:40'],
            'timezone' => ['sometimes', 'string', 'max:60'],
            'locale' => ['sometimes', 'string', 'max:10'],
            'logo_url' => ['sometimes', 'nullable', 'string', 'max:500'],
            'address' => ['sometimes', 'array'],
        ]);

        $organization = Organization::findOrFail($request->user()->organization_id);
        $organization->update($data);

        return $this->updated($organization->fresh(), 'Dados da igreja atualizados.');
    }
}
