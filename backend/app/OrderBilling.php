<?php

namespace App;

use App\Models\BusinessProfile;
use App\Models\Order;

class OrderBilling
{
    /**
     * @return array<string, mixed>
     */
    public function preview(Order $order, ?BusinessProfile $business, int $discountCents = 0): array
    {
        $subtotalCents = (int) round((float) $order->total * 100);
        $chargeableCents = $subtotalCents - $discountCents;
        $serviceRate = (float) ($business?->service_charge_rate ?? 0);
        $taxRate = (float) ($business?->tax_rate ?? 0);
        $serviceCents = (int) round($chargeableCents * $serviceRate / 100);
        $taxCents = (int) round(($chargeableCents + $serviceCents) * $taxRate / 100);

        return [
            'number' => sprintf('R-%06d', $order->id),
            'business' => [
                'name' => $business?->name ?? 'F&B System',
                'phone' => $business?->phone,
                'address' => $business?->address,
            ],
            'currency' => $order->currency,
            'destination' => $this->destination($order),
            'subtotal' => $this->money($subtotalCents),
            'discount_amount' => $this->money($discountCents),
            'service_charge_rate' => $this->rate($serviceRate),
            'service_charge_amount' => $this->money($serviceCents),
            'tax_rate' => $this->rate($taxRate),
            'tax_amount' => $this->money($taxCents),
            'grand_total' => $this->money($chargeableCents + $serviceCents + $taxCents),
            'payment_method' => null,
            'payment_reference' => null,
            'payment_qr_available' => $business?->payment_qr_path !== null,
            'paid_at' => null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function paid(Order $order): array
    {
        return [
            'number' => sprintf('R-%06d', $order->id),
            'business' => [
                'name' => $order->receipt_business_name,
                'phone' => $order->receipt_business_phone,
                'address' => $order->receipt_business_address,
            ],
            'currency' => $order->receipt_currency,
            'destination' => $order->receipt_destination,
            'subtotal' => $order->total,
            'discount_amount' => $order->discount_amount,
            'service_charge_rate' => $order->receipt_service_charge_rate,
            'service_charge_amount' => $order->service_charge_amount,
            'tax_rate' => $order->receipt_tax_rate,
            'tax_amount' => $order->tax_amount,
            'grand_total' => $order->grand_total,
            'payment_method' => $order->payment_method,
            'payment_reference' => $order->payment_reference,
            'payment_qr_available' => false,
            'paid_at' => $order->paid_at?->toIso8601String(),
        ];
    }

    private function destination(Order $order): string
    {
        if ($order->order_type === Order::TAKEAWAY) {
            return $order->pickup_name ? 'Takeaway · '.$order->pickup_name : 'Takeaway';
        }

        return 'Table '.($order->table?->label ?? '?');
    }

    private function money(int $cents): string
    {
        return number_format($cents / 100, 2, '.', '');
    }

    private function rate(float $percent): string
    {
        return number_format($percent, 2, '.', '');
    }
}
