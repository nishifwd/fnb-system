<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\BusinessProfileResource;
use App\Models\BusinessProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

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
            'service_mode' => ['required', Rule::in(['dine_in', 'takeaway', 'both'])],
            'service_charge_rate' => ['sometimes', 'required', 'numeric', 'between:0,100', 'decimal:0,2'],
            'tax_rate' => ['sometimes', 'required', 'numeric', 'between:0,100', 'decimal:0,2'],
        ]);

        $profile = BusinessProfile::query()->updateOrCreate(['id' => 1], $data);

        return new BusinessProfileResource($profile);
    }

    public function paymentQr(): BinaryFileResponse
    {
        $path = BusinessProfile::query()->findOrFail(1)->payment_qr_path;
        abort_unless($path && Storage::disk('local')->exists($path), 404);

        return response()->file(Storage::disk('local')->path($path), [
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function uploadPaymentQr(Request $request): BusinessProfileResource
    {
        $request->validate(['qr' => ['required', 'image', 'mimes:png,jpeg,webp', 'max:2048']]);
        $profile = BusinessProfile::query()->findOrFail(1);
        $path = $request->file('qr')->store('payment-qr', 'local');
        abort_unless($path, 500, 'Could not save payment QR image.');

        $previous = $profile->payment_qr_path;
        $profile->payment_qr_path = $path;
        $profile->save();
        if ($previous) {
            Storage::disk('local')->delete($previous);
        }

        return new BusinessProfileResource($profile);
    }

    public function removePaymentQr(): Response
    {
        $profile = BusinessProfile::query()->findOrFail(1);
        $path = $profile->payment_qr_path;
        $profile->payment_qr_path = null;
        $profile->save();
        if ($path) {
            Storage::disk('local')->delete($path);
        }

        return response()->noContent();
    }
}
