<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\BusinessProfileResource;
use App\Models\BusinessProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusinessProfileController extends Controller
{
    public function show(): BusinessProfileResource|JsonResponse
    {
        $profile = BusinessProfile::query()->find(1);

        return $profile
            ? new BusinessProfileResource($profile)
            : response()->json(['data' => null]);
    }

    public function update(Request $request): BusinessProfileResource
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:2000'],
            'currency' => ['required', 'regex:/^[A-Z]{3}$/'],
        ]);

        $profile = BusinessProfile::query()->updateOrCreate(['id' => 1], $data);

        return new BusinessProfileResource($profile);
    }
}
