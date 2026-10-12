<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::define('manage-workspace', fn (User $user): bool => $user->canManageWorkspace());
        Gate::define('manage-staff', fn (User $user): bool => $user->role === User::ROLE_OWNER);
        Gate::define('place-orders', fn (User $user): bool => in_array($user->role, [User::ROLE_OWNER, User::ROLE_MANAGER, User::ROLE_WAITER], true));
        Gate::define('work-kitchen', fn (User $user): bool => in_array($user->role, [User::ROLE_OWNER, User::ROLE_MANAGER, User::ROLE_KITCHEN], true));
    }
}
