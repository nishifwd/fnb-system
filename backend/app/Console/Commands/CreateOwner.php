<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

#[Signature('staff:create-owner')]
#[Description('Create the first owner account with a private password prompt')]
class CreateOwner extends Command
{
    public function handle(): int
    {
        if (User::query()->where('role', User::ROLE_OWNER)->exists()) {
            $this->error('An owner account already exists.');

            return self::FAILURE;
        }

        $data = [
            'name' => $this->ask('Name'),
            'email' => $this->ask('Email'),
            'password' => $this->secret('Password (at least 12 characters)'),
        ];
        $validator = Validator::make($data, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', Password::min(12)],
        ]);

        if ($validator->fails()) {
            $this->error($validator->errors()->first());

            return self::FAILURE;
        }

        User::query()->create([...$validator->validated(), 'role' => User::ROLE_OWNER]);
        $this->info('Owner account created.');

        return self::SUCCESS;
    }
}
