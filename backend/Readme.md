Below is a **fully structured Markdown documentation**, ready for GitHub, Notion, or any docs site.
If you want, I can also split it into multiple files, add tables, add request/response schemas, or generate a full API Reference website.

---

# FEED FARM OMS – API DOCUMENTATION

**Complete API Routes & Descriptions**
Version: 1.0.0
Format: Markdown

---

# Table of Contents

1. [Authentication & Admin Users](#1-authentication--admin-users)
2. [Customers](#2-customers)
3. [Raw Materials](#3-raw-materials)
4. [Feed Categories](#4-feed-categories)
5. [Finished Feed Stock](#5-finished-feed-stock)
6. [Animal Types](#6-animal-types)
7. [Production Batches](#7-production-batches)
8. [Orders](#8-orders)
9. [Payments](#9-payments)
10. [Expenses](#10-expenses)
11. [Snapshots](#11-snapshots)
12. [Analytics](#12-analytics)

---

# 1. Authentication & Admin Users

## POST `/auth/login`

Authenticate and return token.

## POST `/auth/logout`

Invalidate session (clear cookie / token).

## GET `/admin-users`

List all admin users.

## POST `/admin-users`

Create a new admin.

## GET `/admin-users/:id`

Fetch admin user details.

## PUT `/admin-users/:id`

Update admin (role, contact info).

## DELETE `/admin-users/:id`

Delete admin.

---

# 2. Customers

## GET `/customers`

List all customers.
**Filters:** type, state, createdAt, search (name/phone).

## POST `/customers`

Create customer.

## GET `/customers/:id`

Fetch customer details.

## PUT `/customers/:id`

Update customer details.

## DELETE `/customers/:id`

Delete customer.

## GET `/customers/:id/orders`

List all orders for the customer.

## GET `/customers/:id/snapshots`

List all customer daily summary snapshots.

## GET `/customers/:id/snapshot/latest`

Fetch the most recent summary snapshot (balance, due, total orders).

---

# 3. Raw Materials

## GET `/materials`

List raw materials.

## POST `/materials`

Create raw material.

## GET `/materials/:id`

Raw material details.

## PUT `/materials/:id`

Update material.

## DELETE `/materials/:id`

Delete material.

## GET `/materials/:id/stock`

Compute stock: (IN − OUT).

## GET `/materials/:id/transactions`

List stock transactions.

## POST `/materials/:id/transactions`

Create transaction: IN | OUT | ADJUSTMENT.

## GET `/materials/:id/daily-snapshots`

List daily material snapshots.

---

# 4. Feed Categories

## GET `/feed-categories`

List all feed categories.

## POST `/feed-categories`

Create feed category.

## GET `/feed-categories/:id`

Details of a feed category.

## PUT `/feed-categories/:id`

Update category name, pricing, unitSizeKg.

## DELETE `/feed-categories/:id`

Delete category.

---

# 5. Finished Feed Stock

## GET `/feed-categories/:id/stock`

Get available finished feed stock.

## GET `/feed-categories/:id/stock-transactions`

List stock transactions.

## POST `/feed-categories/:id/stock-transactions`

Create finished feed stock transaction:

* PRODUCTION_IN
* SALE_OUT
* ADJUSTMENT

## GET `/feed-categories/:id/daily-snapshots`

List daily snapshots.

---

# 6. Animal Types

## GET `/animal-types`

List all animal types.

## POST `/animal-types`

Create animal type.

## GET `/animal-types/:id`

Get details.

## PUT `/animal-types/:id`

Update name.

## DELETE `/animal-types/:id`

Delete animal type.

---

# 7. Production Batches

## GET `/production-batches`

List all batches (filters: category, date range).

## POST `/production-batches`

Create production batch:

* feedCategoryId
* producedBags / producedKg
* materials used
* adminUserId

Automatically:

* Deduct raw materials
* Add finished feed stock

## GET `/production-batches/:id`

Full batch details.

## PUT `/production-batches/:id`

Update batch.

## DELETE `/production-batches/:id`

Delete batch and reverse stock.

---

# 8. Orders

## GET `/orders`

List orders (filters: status, customer, admin, date range).

## POST `/orders`

Create order:

* items
* discount
* delivery date

Automatically creates SALE_OUT stock txn.

## GET `/orders/:id`

Full order details.

## PUT `/orders/:id`

Update status or items (if allowed).

## DELETE `/orders/:id`

Delete order and reverse stock.

### Order Items

#### POST `/orders/:id/items`

Add item.

#### PUT `/orders/:id/items/:itemId`

Update item.

#### DELETE `/orders/:id/items/:itemId`

Remove item.

---

# 9. Payments

## GET `/payments`

List all payments.

## POST `/payments`

Create payment:

* amount
* method
* note

Auto-updates due/paid amounts.

## GET `/payments/:id`

Get payment details.

## DELETE `/payments/:id`

Delete payment and reverse order balance.

---

# 10. Expenses

## GET `/expenses`

List expenses.

## POST `/expenses`

Create expense entry.

## GET `/expenses/:id`

Fetch expense.

## PUT `/expenses/:id`

Update.

## DELETE `/expenses/:id`

Remove expense.

---

# 11. Snapshots

## POST `/snapshots/run/raw-material`

Compute daily raw material snapshots.

## POST `/snapshots/run/finished-feed`

Compute daily finished feed snapshots.

## POST `/snapshots/run/customer-summary`

Compute customer summary snapshots.

---

# 12. Analytics

## GET `/analytics/overview`

Key dashboard metrics:

* orders today
* due amounts
* stock levels
* production

## GET `/analytics/stock/raw`

Raw material stock summary.

## GET `/analytics/stock/finished`

Finished feed stock summary.

## GET `/analytics/orders/by-status`

Order counts grouped by status.

## GET `/analytics/payments/by-method`

Payment totals grouped by method.

## GET `/analytics/customer/:id`

Customer ledger (orders, payments, balances).

---
