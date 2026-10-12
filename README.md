# F&B System

A restaurant and café web app in progress. The current local build supports staff login, business and menu setup, floor layout, table orders, and kitchen tracking. It uses a Laravel API, a React frontend, and SQLite. Customer QR ordering and billing are planned for later phases.

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
php artisan staff:create-owner
php artisan serve --host=127.0.0.1 --port=8001
```

For macOS/Linux, use `cp .env.example .env` and `touch database/database.sqlite` in place of the two PowerShell file commands.

### Terminal 2: React

```powershell
cd frontend
npm ci
npm run dev
```

Open the local URL printed by Vite (usually [http://localhost:5173](http://localhost:5173)) and sign in. After signing in, the workspace should show **Laravel connected**. Vite proxies `/api` requests to Laravel on `127.0.0.1:8001`, so keep both terminals running. You can also check [http://127.0.0.1:8001/api/v1/health](http://127.0.0.1:8001/api/v1/health) directly; it returns `{"status":"ok","service":"fnb-system"}`.

`staff:create-owner` asks for a name, email, and password of at least 12 characters. It creates the first owner once and never stores a sample password in Git. If you already ran the Phase 2 setup, run `php artisan migrate` and then `php artisan staff:create-owner` before opening React. Sign in with that owner account. The owner can add managers, waiters, and kitchen staff from **Staff**.

Owners and managers can use the business, menu, tables, orders, and kitchen screens. Only owners can manage staff. Waiters use **Orders** and kitchen staff use **Kitchen**. The API uses Laravel sessions and CSRF protection for changes. Keep the frontend and backend on the same local origin through the Vite proxy.

If you already have an owner account, run `php artisan migrate` from `backend` to add the order tables. Refresh React after the migration. A waiter can tap a table on the saved floor layout, choose available menu items, add a kitchen note, and send an order. The kitchen board shows new orders; kitchen staff mark them preparing and then ready. Waiters mark ready orders served. Both screens refresh open orders every 10 seconds or with the **Refresh** button. Owners and managers can perform either workflow. Menu prices and names are saved with each order so later menu edits do not alter existing orders. Tables with order history cannot be deleted.

Use the sidebar to edit **Business**, **Menu**, and **Tables**. The sidebar stays visible while you scroll. Tables shows one combined floor plan with areas such as Indoor and Outdoor. Drag open space inside an area to move it, drag its corner to resize it, or use **Edit size & position** for exact percentages. Drag the entrance marker around the floor plan edge to change its side and position, or use the entrance controls for exact values. Drag tables inside their area, use the table editor to move a table to another area, or enter exact X/Y positions. Choose a round, square, or rectangular table; rectangles have a visibly longer side. Use **Rotate 90°** or the rotation selector to turn a table, then save it. The table list also has a **Rotate** action that saves immediately. Existing tables stay assigned to Indoor when migrations run. Categories containing items cannot be deleted until those items are removed. The frontend uses Inter and JetBrains Mono, matching Project UMK; these fonts load from Google Fonts when online.

For optional fictional sample data, run `php artisan db:seed` from `backend`. On a fresh database it adds a side by side Indoor and Outdoor layout, including a rotated Outdoor table. Seeding can be run again without duplicating the sample records.

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

Table ordering and kitchen status tracking are in place. Customer QR ordering, invoices, payments, tax handling, and order history views are not yet implemented. The screens poll for updates every 10 seconds rather than showing instant push updates. Password reset, email delivery, and account recovery are not yet implemented; an owner can remove staff and create a replacement account. Review deployment security and session settings before exposing this app publicly.

## Project layout

- `backend/`: Laravel API and database migrations
- `frontend/`: React, Vite, and HeroUI
- `.github/workflows/ci.yml`: automated checks

Local `.env` files, the SQLite database, dependencies, and build output stay out of Git. Commit `.env.example`, `composer.lock`, and `package-lock.json` so another developer can reproduce the setup.
