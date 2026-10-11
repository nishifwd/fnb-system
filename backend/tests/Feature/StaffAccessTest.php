<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_open_management_routes_but_health_is_public(): void
    {
        $this->getJson('/api/v1/health')->assertOk();
        $this->getJson('/api/v1/business')->assertUnauthorized();
        $this->postJson('/api/v1/categories', [])->assertUnauthorized();
        $this->getJson('/api/v1/staff')->assertUnauthorized();
    }

    public function test_login_logout_and_session_identity(): void
    {
        $user = User::factory()->create([
            'role' => User::ROLE_OWNER,
            'password' => 'a-long-secret-password',
        ]);

        $this->getJson('/api/v1/auth/csrf')->assertOk()->assertJsonStructure(['data' => ['token']]);
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'wrong-password'])
            ->assertUnprocessable();
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'a-long-secret-password'])
            ->assertOk()->assertJsonPath('data.user.role', User::ROLE_OWNER)
            ->assertJsonStructure(['data' => ['csrf_token']]);
        $this->getJson('/api/v1/auth/me')->assertOk()->assertJsonPath('data.id', $user->id);
        $this->postJson('/api/v1/auth/logout')->assertOk();
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_staff_roles_have_limited_access(): void
    {
        $manager = User::factory()->create(['role' => User::ROLE_MANAGER]);
        $waiter = User::factory()->create(['role' => User::ROLE_WAITER]);
        $kitchen = User::factory()->create(['role' => User::ROLE_KITCHEN]);

        $this->actingAs($manager)->getJson('/api/v1/business')->assertOk();
        $this->actingAs($manager)->getJson('/api/v1/staff')->assertForbidden();
        $this->actingAs($waiter)->getJson('/api/v1/business')->assertForbidden();
        $this->actingAs($kitchen)->getJson('/api/v1/tables')->assertForbidden();
        $this->actingAs($kitchen)->getJson('/api/v1/auth/me')->assertOk();
    }

    public function test_owner_can_create_and_remove_staff_but_cannot_create_another_owner(): void
    {
        $owner = User::factory()->create(['role' => User::ROLE_OWNER]);
        $this->actingAs($owner);

        $staff = $this->postJson('/api/v1/staff', [
            'name' => 'Sam',
            'email' => 'sam@example.com',
            'role' => User::ROLE_WAITER,
            'password' => 'twelve-char-password',
        ])->assertCreated()->assertJsonPath('data.role', User::ROLE_WAITER)->json('data');

        $this->postJson('/api/v1/staff', [
            'name' => 'Another Owner',
            'email' => 'owner2@example.com',
            'role' => User::ROLE_OWNER,
            'password' => 'twelve-char-password',
        ])->assertUnprocessable()->assertJsonValidationErrors('role');

        $this->getJson('/api/v1/staff')->assertOk()->assertJsonCount(2, 'data');
        $this->deleteJson('/api/v1/staff/'.$owner->id)->assertStatus(409);
        $this->deleteJson('/api/v1/staff/'.$staff['id'])->assertNoContent();
        $this->assertDatabaseMissing('users', ['id' => $staff['id']]);
    }

    public function test_owner_creation_command_refuses_a_second_owner(): void
    {
        User::factory()->create(['role' => User::ROLE_OWNER]);

        $this->artisan('staff:create-owner')->assertFailed();
    }

    public function test_owner_creation_command_creates_first_owner(): void
    {
        $this->artisan('staff:create-owner')
            ->expectsQuestion('Name', 'Amina')
            ->expectsQuestion('Email', 'amina@example.com')
            ->expectsQuestion('Password (at least 12 characters)', 'private-password-123')
            ->assertSuccessful();

        $this->assertDatabaseHas('users', [
            'name' => 'Amina',
            'email' => 'amina@example.com',
            'role' => User::ROLE_OWNER,
        ]);
    }
}
