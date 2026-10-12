# F&B System

A restaurant and café web app in progress. The current local build supports staff login, business and menu setup, dine-in and takeaway orders, floor layout, kitchen tracking, and billing. It uses a Laravel API, a React frontend, and SQLite. Customer QR ordering is planned for a later phase.

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

Owners and managers can use the business, menu, tables, orders, kitchen, and billing screens. Only owners can manage staff. Waiters use **Orders** and **Billing**; kitchen staff use **Kitchen**. The API uses Laravel sessions and CSRF protection for changes. Keep the frontend and backend on the same local origin through the Vite proxy.

If you already have an owner account, run `php artisan migrate` from `backend` after updating this branch. Refresh React after the migration. In **Business**, choose **Dine-in and takeaway**, **Dine-in only**, or **Takeaway only**. Takeaway-only businesses do not need tables; the Tables section is hidden. A waiter can tap a table on the saved floor layout for dine-in, or choose Takeaway and optionally enter a pickup name. Every order gets a number. The kitchen board shows both types; kitchen staff mark them preparing and then ready. Waiters mark dine-in orders served and takeaway orders collected. Both screens refresh open orders every 10 seconds or with the **Refresh** button. Owners and managers can perform either workflow. Tables with order history cannot be deleted.

In **Menu**, create categories such as Coffee, Cold Drinks, Food, and Pastries, then choose a category for each item. The screen groups items by category. New categories and items receive a display position automatically; there is no number to enter. Mark an item as a drink and turn on only the choices that drink offers: hot/iced, sugar level, ice level, Small size, or Large size. Standard size is always available. If no choices are enabled, staff can order the drink at Standard size without answering extra questions. Ice choices do not appear when Hot is selected. Food items have an optional per-item remark. The kitchen board shows the saved choices or food remarks on each order line. Staff can add the same drink with different choices as separate lines. Menu prices and names are saved with each order, and the current choices do not change the price.

Use the sidebar to edit **Business**, **Menu**, and **Tables**. The sidebar stays visible while you scroll. Tables shows one combined floor plan with areas such as Indoor and Outdoor. Drag open space inside an area to move it, drag its corner to resize it, or use **Edit size & position** for exact percentages. Drag the entrance marker anywhere on the floor plan, including the middle, or use exact Left/Top percentages. Drag tables inside their area, use the table editor to move a table to another area, or enter exact X/Y positions. Choose a round, square, or rectangular table; rectangles have a visibly longer side. Use **Rotate 90°** or the rotation selector to turn a table, then save it. The table list also has a **Rotate** action that saves immediately. Existing tables stay assigned to Indoor when migrations run. Categories containing items cannot be deleted until those items are removed. The frontend uses Inter and JetBrains Mono, matching Project UMK; these fonts load from Google Fonts when online.

In **Business**, set service charge and tax percentages if they apply; both default to 0%. An owner or manager can also upload a bank-issued payment QR image (PNG, JPG, or WebP, up to 2 MB). In **Billing**, staff can find past orders, including served orders, preview a fixed discount, and choose Cash, Card terminal, or QR payment. For card and QR, staff must check the successful payment in the terminal or provider app before recording it; an optional transaction reference is saved on the receipt. The uploaded QR appears beside the exact amount due. A static QR may still require the customer to enter that amount manually. The discount reduces the item subtotal first. Service charge applies to the discounted subtotal; tax applies to that subtotal plus service charge. Paid receipts retain the business details, rates, totals, and table or pickup label from checkout. This is a configurable billing flow, not a jurisdiction-specific tax or e-invoicing integration.

For fictional sample data, run `php artisan db:seed` from `backend`. On a fresh database it adds 11 menu items across Coffee, Cold Drinks, Food, and Pastries, plus a side by side Indoor and Outdoor layout with a rotated Outdoor table. The drinks demonstrate different choice settings, including Bottled Water with Standard size only. Running the seeder again does not duplicate sample records or overwrite edits to existing items. If Flat White was seeded before drink choices were added, edit it in **Menu** to mark it as a drink and set its choices.

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

Dine-in and takeaway ordering, kitchen tracking, manual cash/card/QR payment recording, order history, and printable receipts are in place. Card terminal control and automatic QR payment confirmation require a chosen provider and its API; no device or payment gateway is connected yet. Customer table QR ordering, partial payments, refunds, and jurisdiction-specific tax or e-invoicing requirements are not yet implemented. The service screens poll for updates every 10 seconds rather than showing instant push updates. Password reset, email delivery, and account recovery are not yet implemented; an owner can remove staff and create a replacement account. Review deployment security and session settings before exposing this app publicly.

## Project layout

- `backend/`: Laravel API and database migrations
- `frontend/`: React, Vite, and HeroUI
- `.github/workflows/ci.yml`: automated checks

Local `.env` files, the SQLite database, dependencies, and build output stay out of Git. Commit `.env.example`, `composer.lock`, and `package-lock.json` so another developer can reproduce the setup.
