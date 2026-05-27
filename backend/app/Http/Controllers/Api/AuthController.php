<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private AuditService $audit) {}

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            $this->audit->log('login_failed', null, null, ['email' => $request->email]);
            throw ValidationException::withMessages(['email' => ['Invalid credentials.']]);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Account is deactivated.'], 403);
        }

        $user->update(['last_login_at' => now()]);

        $token = $user->createToken('api-token')->plainTextToken;

        $this->audit->log('login', 'User', $user->id, null, $request);

        return response()->json([
            'token' => $token,
            'user'  => $user->load('roles', 'permissions'),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->audit->log('logout', 'User', $request->user()->id, null, $request);
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user()->load('roles', 'permissions', 'district'));
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ]);

        if (! Hash::check($request->current_password, $request->user()->password)) {
            throw ValidationException::withMessages(['current_password' => ['Current password is incorrect.']]);
        }

        $request->user()->update(['password' => Hash::make($request->password)]);
        $this->audit->log('password_changed', 'User', $request->user()->id, null, $request);

        return response()->json(['message' => 'Password changed successfully.']);
    }
}
