<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StaffController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => User::query()->orderBy('name')->get(['id', 'name', 'email', 'role'])]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')],
            'role' => ['required', Rule::in([User::ROLE_MANAGER, User::ROLE_WAITER, User::ROLE_KITCHEN])],
            'password' => ['required', Password::min(12)],
        ]);

        $user = User::query()->create($data);

        return response()->json(['data' => $user->only(['id', 'name', 'email', 'role'])], 201);
    }

    public function destroy(Request $request, User $staff): JsonResponse
    {
        if ($staff->role === User::ROLE_OWNER || $staff->id === $request->user()->id) {
            return response()->json(['message' => 'The owner account cannot be removed.'], 409);
        }

        $staff->delete();

        return response()->json(status: 204);
    }
}
