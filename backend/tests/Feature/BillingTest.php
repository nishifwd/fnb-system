<?php

namespace Tests\Feature;

use App\Models\BusinessProfile;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BillingTest extends TestCase
{
    use RefreshDatabase;

    public function test_payment_calculates_charges_and_preserves_receipt_details(): void
    {
        $business = BusinessProfile::factory()->create([
            'name' => 'Kopi Corner', 'currency' => 'MYR', 'service_charge_rate' => '10.00', 'tax_rate' => '6.00',
        ]);
        $order = Order::factory()->create(['total' => '25.00', 'status' => Order::SERVED]);
        $this->actingAs(User::factory()->create(['role' => User::ROLE_WAITER]));

        $this->getJson('/api/v1/billing/orders/'.$order->id.'?discount_amount=5.00')
            ->assertOk()
            ->assertJsonPath('data.bill.subtotal', '25.00')
            ->assertJsonPath('data.bill.discount_amount', '5.00')
            ->assertJsonPath('data.bill.service_charge_amount', '2.00')
            ->assertJsonPath('data.bill.tax_amount', '1.32')
            ->assertJsonPath('data.bill.grand_total', '23.32');

        $this->postJson('/api/v1/billing/orders/'.$order->id.'/payment', [
            'payment_method' => 'card', 'discount_amount' => '5.00', 'expected_grand_total' => '23.32',
            'confirmed_payment' => true, 'payment_reference' => 'TERM-123',
        ])->assertOk()->assertJsonPath('data.bill.number', sprintf('R-%06d', $order->id))
            ->assertJsonPath('data.bill.grand_total', '23.32')
            ->assertJsonPath('data.bill.payment_method', 'card')
            ->assertJsonPath('data.bill.payment_reference', 'TERM-123')
            ->assertJsonPath('data.bill.business.name', 'Kopi Corner');

        $this->postJson('/api/v1/billing/orders/'.$order->id.'/payment', [
            'payment_method' => 'cash', 'discount_amount' => '0', 'expected_grand_total' => '23.32',
        ])->assertStatus(409);

        $business->update(['name' => 'New Name', 'currency' => 'USD', 'service_charge_rate' => 20, 'tax_rate' => 0]);
        $this->getJson('/api/v1/billing/orders/'.$order->id)
            ->assertOk()->assertJsonPath('data.bill.business.name', 'Kopi Corner')
            ->assertJsonPath('data.bill.currency', 'MYR')
            ->assertJsonPath('data.bill.service_charge_rate', '10.00')
            ->assertJsonPath('data.bill.tax_rate', '6.00')
            ->assertJsonPath('data.bill.grand_total', '23.32');

        $this->getJson('/api/v1/billing/orders?filter=paid')->assertOk()
            ->assertJsonPath('data.orders.0.id', $order->id)
            ->assertJsonPath('data.orders.0.grand_total', '23.32');
    }

    public function test_billing_rejects_invalid_discount_and_kitchen_access(): void
    {
        $order = Order::factory()->create(['total' => '8.50']);
        $this->getJson('/api/v1/billing/orders')->assertUnauthorized();
        $this->actingAs(User::factory()->create(['role' => User::ROLE_KITCHEN]))
            ->getJson('/api/v1/billing/orders')->assertForbidden();
        $this->postJson('/api/v1/billing/orders/'.$order->id.'/payment', [
            'payment_method' => 'cash', 'discount_amount' => '0', 'expected_grand_total' => '8.50',
        ])->assertForbidden();

        $this->actingAs(User::factory()->create(['role' => User::ROLE_WAITER]));
        $this->postJson('/api/v1/billing/orders/'.$order->id.'/payment', [
            'payment_method' => 'bitcoin', 'discount_amount' => '0', 'expected_grand_total' => '8.50',
        ])->assertUnprocessable()->assertJsonValidationErrors('payment_method');
        $this->postJson('/api/v1/billing/orders/'.$order->id.'/payment', [
            'payment_method' => 'cash', 'discount_amount' => '8.51', 'expected_grand_total' => '0',
        ])->assertUnprocessable()->assertJsonValidationErrors('discount_amount');
        $this->postJson('/api/v1/billing/orders/'.$order->id.'/payment', [
            'payment_method' => 'cash', 'discount_amount' => '0.001', 'expected_grand_total' => '8.50',
        ])->assertUnprocessable()->assertJsonValidationErrors('discount_amount');
        $this->assertNull($order->fresh()->paid_at);
    }

    public function test_payment_requires_staff_to_confirm_the_current_total(): void
    {
        $business = BusinessProfile::factory()->create(['service_charge_rate' => '0.00']);
        $order = Order::factory()->create(['total' => '20.00']);
        $this->actingAs(User::factory()->create(['role' => User::ROLE_WAITER]));

        $this->getJson('/api/v1/billing/orders/'.$order->id)
            ->assertOk()->assertJsonPath('data.bill.grand_total', '20.00');

        $business->update(['service_charge_rate' => '10.00']);

        $payment = ['payment_method' => 'cash', 'discount_amount' => '0'];
        $this->postJson('/api/v1/billing/orders/'.$order->id.'/payment', $payment)
            ->assertUnprocessable()->assertJsonValidationErrors('expected_grand_total');
        $this->postJson('/api/v1/billing/orders/'.$order->id.'/payment', [
            ...$payment, 'expected_grand_total' => '20.00',
        ])->assertStatus(409);
        $this->assertNull($order->fresh()->paid_at);

        $this->getJson('/api/v1/billing/orders/'.$order->id)
            ->assertOk()->assertJsonPath('data.bill.grand_total', '22.00');
        $this->postJson('/api/v1/billing/orders/'.$order->id.'/payment', [
            ...$payment, 'expected_grand_total' => '22.00',
        ])->assertOk()->assertJsonPath('data.bill.grand_total', '22.00');
    }

    public function test_completed_unpaid_orders_remain_in_history(): void
    {
        $order = Order::factory()->create(['total' => '12.00', 'status' => Order::SERVED]);
        $this->actingAs(User::factory()->create(['role' => User::ROLE_MANAGER]));

        $this->getJson('/api/v1/orders')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/billing/orders?filter=unpaid')->assertOk()
            ->assertJsonPath('data.orders.0.id', $order->id)
            ->assertJsonPath('data.total', 1);
    }

    public function test_qr_image_can_be_uploaded_and_qr_payment_requires_manual_confirmation(): void
    {
        Storage::fake('local');
        BusinessProfile::factory()->create();
        $order = Order::factory()->create(['total' => '12.00']);
        $this->actingAs(User::factory()->create(['role' => User::ROLE_MANAGER]));

        $this->post('/api/v1/business/payment-qr', [
            'qr' => UploadedFile::fake()->image('merchant.png'),
        ])->assertOk()->assertJsonPath('data.has_payment_qr', true);
        $this->assertCount(1, Storage::disk('local')->allFiles('payment-qr'));
        $this->post('/api/v1/business/payment-qr', [
            'qr' => UploadedFile::fake()->image('replacement.png'),
        ])->assertOk();
        $this->assertCount(1, Storage::disk('local')->allFiles('payment-qr'));
        $this->get('/api/v1/business/payment-qr')->assertOk();
        $this->getJson('/api/v1/billing/orders/'.$order->id)
            ->assertOk()->assertJsonPath('data.bill.payment_qr_available', true);

        $this->postJson('/api/v1/billing/orders/'.$order->id.'/payment', [
            'payment_method' => 'qr', 'discount_amount' => '0', 'expected_grand_total' => '12.00',
        ])->assertUnprocessable()->assertJsonValidationErrors('confirmed_payment');
        $this->postJson('/api/v1/billing/orders/'.$order->id.'/payment', [
            'payment_method' => 'qr', 'discount_amount' => '0', 'expected_grand_total' => '12.00',
            'confirmed_payment' => true, 'payment_reference' => 'QR-987',
        ])->assertOk()->assertJsonPath('data.bill.payment_method', 'qr')
            ->assertJsonPath('data.bill.payment_reference', 'QR-987');

        $this->deleteJson('/api/v1/business/payment-qr')->assertNoContent();
        $this->get('/api/v1/business/payment-qr')->assertNotFound();
        $this->assertCount(0, Storage::disk('local')->allFiles('payment-qr'));
        $this->getJson('/api/v1/business')->assertOk()->assertJsonPath('data.has_payment_qr', false);
    }

    public function test_order_keeps_its_currency_when_business_currency_changes_before_checkout(): void
    {
        $business = BusinessProfile::factory()->create(['currency' => 'USD', 'service_mode' => 'takeaway']);
        $item = MenuItem::factory()->create(['price' => '12.00']);
        $this->actingAs(User::factory()->create(['role' => User::ROLE_WAITER]));

        $order = $this->postJson('/api/v1/orders', [
            'order_type' => Order::TAKEAWAY,
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
        ])->assertCreated()->assertJsonPath('data.currency', 'USD')->json('data');

        $business->update(['currency' => 'MYR']);
        $this->getJson('/api/v1/billing/orders/'.$order['id'])
            ->assertOk()->assertJsonPath('data.bill.currency', 'USD');
    }
}
