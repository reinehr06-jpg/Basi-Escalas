<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Models\Organization;
use App\Models\User;
use App\Models\Volunteer;
use App\Support\OrganizationContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends ApiController
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ]);

        /** @var User|null $user */
        $user = User::withoutGlobalScope('organization')
            ->where('email', strtolower($data['email']))
            ->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Credenciais inválidas.'],
            ]);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'email' => ['Este usuário está inativo.'],
            ]);
        }

        $user->forceFill(['last_login_at' => now()])->save();

        $expiresAt = ($data['remember'] ?? false) ? now()->addDays(7) : now()->addHours(8);
        $token = $user->createToken('web', ['*'], $expiresAt);

        return response()->json([
            'token' => $token->plainTextToken,
            'accessToken' => $token->plainTextToken,
            'expires_at' => $expiresAt->toIso8601String(),
            'user' => $this->userPayload($user),
        ]);
    }

    /** Cria uma organização nova com o primeiro administrador. */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'organization_name' => ['required', 'string', 'max:160'],
            'name' => ['required', 'string', 'max:160'],
            'email' => ['required', 'email', 'max:160'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:40'],
        ]);

        $exists = User::withoutGlobalScope('organization')
            ->where('email', strtolower($data['email']))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'email' => ['Este e-mail já está em uso.'],
            ]);
        }

        $organization = Organization::create([
            'name' => $data['organization_name'],
            'slug' => Str::slug($data['organization_name']).'-'.Str::lower(Str::random(5)),
            'email' => strtolower($data['email']),
        ]);

        $context = app(OrganizationContext::class);
        $context->set((string) $organization->getKey());

        $volunteer = Volunteer::create([
            'organization_id' => (string) $organization->getKey(),
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'phone' => $data['phone'] ?? null,
        ]);

        $user = User::create([
            'organization_id' => (string) $organization->getKey(),
            'volunteer_id' => (string) $volunteer->getKey(),
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'password' => $data['password'],
            'role' => UserRole::Admin->value,
            'phone' => $data['phone'] ?? null,
        ]);

        $token = $user->createToken('web', ['*'], now()->addDays(7));

        return response()->json([
            'token' => $token->plainTextToken,
            'accessToken' => $token->plainTextToken,
            'user' => $this->userPayload($user),
        ], 201);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $this->userPayload($request->user())]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Sessão encerrada.']);
    }

    private function userPayload(User $user): array
    {
        $organization = Organization::withTrashed()->find($user->organization_id);

        return [
            'id' => (string) $user->getKey(),
            '_id' => (string) $user->getKey(),
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role?->value,
            'role_label' => $user->role?->label(),
            'status' => $user->status,
            'avatar_url' => $user->avatar_url,
            'volunteer_id' => $user->volunteer_id ? (string) $user->volunteer_id : null,
            'organization_id' => (string) $user->organization_id,
            'organization' => $organization ? [
                'id' => (string) $organization->getKey(),
                'name' => $organization->name,
                'timezone' => $organization->timezone,
                'locale' => $organization->locale,
                'logo_url' => $organization->logo_url,
            ] : null,
            'led_ministry_ids' => $user->ledMinistryIds(),
        ];
    }
}
