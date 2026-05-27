<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function __construct(private AuditService $audit) {}

    public function index(Request $request): JsonResponse
    {
        $query = User::with(['roles', 'district'])
            ->when($request->search, fn($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('name', 'like', "%$s%")
                  ->orWhere('email', 'like', "%$s%")
                  ->orWhere('employee_id', 'like', "%$s%");
            }))
            ->when($request->role, fn($q, $r) => $q->role($r))
            ->when($request->district_id, fn($q, $d) => $q->where('district_id', $d))
            ->when($request->active !== null, fn($q) => $q->where('is_active', filter_var($request->active, FILTER_VALIDATE_BOOLEAN)));

        return response()->json($query->orderBy('name')->paginate(25));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:200',
            'email'       => 'required|email|unique:users,email',
            'password'    => 'required|string|min:8',
            'employee_id' => 'nullable|string|unique:users,employee_id',
            'phone'       => 'nullable|string|max:20',
            'job_title'   => 'nullable|string|max:100',
            'district_id' => 'nullable|exists:districts,id',
            'role'        => 'required|string|exists:roles,name',
        ]);

        $role = $data['role'];
        unset($data['role']);

        $data['password']  = Hash::make($data['password']);
        $data['is_active'] = true;

        $user = User::create($data);
        $user->assignRole($role);

        $this->audit->log('user_created', 'User', $user->id, ['role' => $role], $request);

        return response()->json($user->load('roles'), 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json($user->load('roles', 'permissions', 'district'));
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:200',
            'phone'       => 'nullable|string|max:20',
            'job_title'   => 'nullable|string|max:100',
            'district_id' => 'nullable|exists:districts,id',
            'avatar'      => 'nullable|string',
        ]);

        $user->update($data);
        $this->audit->log('user_updated', 'User', $user->id, $data, $request);

        return response()->json($user->fresh()->load('roles'));
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        $this->audit->log('user_deleted', 'User', $user->id, null, $request);
        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }

    public function activate(Request $request, User $user): JsonResponse
    {
        $user->update(['is_active' => true]);
        $this->audit->log('user_activated', 'User', $user->id, null, $request);

        return response()->json(['message' => 'User activated.']);
    }

    public function deactivate(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot deactivate your own account.'], 422);
        }

        $user->update(['is_active' => false]);
        // Revoke all API tokens for the deactivated user
        $user->tokens()->delete();
        $this->audit->log('user_deactivated', 'User', $user->id, null, $request);

        return response()->json(['message' => 'User deactivated.']);
    }

    public function assignRole(Request $request, User $user): JsonResponse
    {
        $data = $request->validate(['role' => 'required|string|exists:roles,name']);

        $user->syncRoles([$data['role']]);
        $this->audit->log('user_role_assigned', 'User', $user->id, $data, $request);

        return response()->json($user->fresh()->load('roles'));
    }

    public function roles(): JsonResponse
    {
        return response()->json(Role::all());
    }
}
