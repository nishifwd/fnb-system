<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BusinessProfileResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'address' => $this->address,
            'currency' => $this->currency,
            'service_mode' => $this->service_mode,
            'service_charge_rate' => $this->service_charge_rate,
            'tax_rate' => $this->tax_rate,
            'has_payment_qr' => $this->payment_qr_path !== null,
        ];
    }
}
