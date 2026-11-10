<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\User;
use App\Models\Volunteer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/** Usuários do sistema e seus papéis (base do módulo 15). */
class SystemUserController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query()->orderBy('name');

        $this->applySearch($query, $request->input('q'), ['name', 'email']);

        foreach (['role', 'status'] as $filter) {
            if ($value = $request->input($filter)) {
                $query->where($filter, $value);
            }
        }

        return $this->paginate($query, $request);
    }

    public function show(string $id): JsonResponse
    {
        $user = User::findOrFail($id);

        return response()->json([
            'item' => $user,
            'volunteer' => $user->volunteer_id ? Volunteer::find($user->volunteer_id) : null,
            'roles' => $this->roles(),
        ]);
    }

    public function roles(): array
    {
        return collect(UserRole::cases())
            ->map(fn (UserRole $role) => ['value' => $role->value, 'label' => $role->label()])
            ->all();
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'email' => ['required', 'email', 'max:160'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'in:'.implode(',', UserRole::values())],
            'volunteer_id' => ['sometimes', 'nullable', 'string'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'status' => ['sometimes', 'in:active,inactive'],
        ]);

        $exists = User::withoutGlobalScope('organization')
            ->where('email', strtolower($data['email']))->exists();

        if ($exists) {
            throw ValidationException::withMessages(['email' => ['Este e-mail já está em uso.']]);
        }

        $data['email'] = strtolower($data['email']);
        $user = User::create($data);

        AuditLog::record('user.created', $user, "Usuário {$user->name} criado como {$user->role?->label()}");

        return $this->created($user, 'Usuário criado com sucesso.');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:160'],
            'email' => ['sometimes', 'email', 'max:160'],
            'password' => ['sometimes', 'nullable', 'string', 'min:8'],
            'role' => ['sometimes', 'in:'.implode(',', UserRole::values())],
            'volunteer_id' => ['sometimes', 'nullable', 'string'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'status' => ['sometimes', 'in:active,inactive'],
        ]);

        if (empty($data['password'])) {
            unset($data['password']);
        }

        if (isset($data['email'])) {
            $data['email'] = strtolower($data['email']);
        }

        // Não deixar a igreja ficar sem nenhum administrador ativo.
        if ((isset($data['role']) && $data['role'] !== UserRole::Admin->value)
            || (isset($data['status']) && $data['status'] !== 'active')) {
            if ($user->role === UserRole::Admin && $this->activeAdmins() <= 1) {
                return response()->json([
                    'message' => 'Este é o último administrador ativo. Promova outro usuário antes de alterar este.',
                ], 422);
            }
        }

        $user->update($data);

        AuditLog::record('user.updated', $user, "Usuário {$user->name} atualizado");

        return $this->updated($user->fresh(), 'Usuário atualizado com sucesso.');
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ((string) $user->getKey() === (string) $request->user()->getKey()) {
            return response()->json(['message' => 'Você não pode excluir o próprio usuário.'], 422);
        }

        if ($user->role === UserRole::Admin && $this->activeAdmins() <= 1) {
            return response()->json(['message' => 'Este é o último administrador ativo.'], 422);
        }

        $user->delete();

        AuditLog::record('user.deleted', $user, "Usuário {$user->name} excluído");

        return $this->deleted('Usuário excluído com sucesso.');
    }

    private function activeAdmins(): int
    {
        return User::where('role', UserRole::Admin->value)->where('status', 'active')->count();
    }
}
