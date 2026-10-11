# F&B System

A restaurant and café web app in progress. The current local build lets you set business details, manage menu categories and items, and arrange dining tables. It uses a Laravel API, a React frontend, and SQLite. Staff ordering, customer QR ordering, kitchen tracking, and billing are planned for later phases.

## Requirements

- PHP 8.3 or newer with SQLite support, and Composer
- Node.js 22 or newer with npm

On Windows, [Laravel Herd](https://herd.laravel.com/windows) provides PHP and Composer. Open a **new terminal** after installing Herd. Check the tools with `php -v`, `composer --version`, `node -v`, and `npm -v`.

## First-time setup

Clone this repository, then open two terminals in its root directory.

### Terminal 1: Laravel

```powershell
cd backend
composer install
Copy-Item .env.example .env
php artisan key:generate
New-Item database/database.sqlite -ItemType File -Force
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8001
```

For macOS/Linux, use `cp .env.example .env` and `touch database/database.sqlite` in place of the two PowerShell file commands.

### Terminal 2: React

```powershell
cd frontend
npm ci
npm run dev
```

Open the local URL printed by Vite (usually [http://localhost:5173](http://localhost:5173)). The page should show **Laravel API connected**. Vite proxies `/api` requests to Laravel on `127.0.0.1:8001`, so keep both terminals running. You can also check [http://127.0.0.1:8001/api/v1/health](http://127.0.0.1:8001/api/v1/health) directly; it returns `{"status":"ok","service":"fnb-system"}`.

Use the sidebar to edit **Business**, **Menu**, and **Tables**. In Tables, drag a table on the floor plan or enter exact X/Y positions. Categories containing items cannot be deleted until those items are removed.

For optional fictional sample data, run `php artisan db:seed` from `backend`. Seeding can be run again without duplicating the sample records.

If Herd works in a normal terminal but `php` is unavailable in an older terminal, close and reopen it so the PATH refreshes.

## Checks

From `backend`:

```powershell
php artisan migrate:status
php artisan test --compact
```

From `frontend`:

```powershell
npm run lint
npm run build
```

GitHub Actions runs the SQLite migrations, Laravel tests, frontend lint, and frontend build on pushes and pull requests.

## Current scope

The management API does not have accounts or access control yet. Keep this version for local development; add authentication and authorization before deploying it publicly.

## Project layout

- `backend/`: Laravel API and database migrations
- `frontend/`: React, Vite, and HeroUI
- `.github/workflows/ci.yml`: automated checks

Local `.env` files, the SQLite database, dependencies, and build output stay out of Git. Commit `.env.example`, `composer.lock`, and `package-lock.json` so another developer can reproduce the setup.
