# Feed Farm OMS 2

Feed Farm OMS 2 is an operations management system for a feed/farm business.  
It manages inventory (raw materials + finished feed), production batches, customers, orders, payments, refunds, expenses, and dashboard analytics.

## Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Axios, TanStack Query
- **Backend:** Node.js, Express, TypeScript, Prisma ORM
- **Database:** PostgreSQL
- **Scheduling:** node-cron (daily snapshot/report generation)

## Repository Structure

```text
feed-farm-oms-2/
├── backend/   # Express + Prisma API
└── frontend/  # Next.js admin dashboard
```

## High-Level Architecture

1. Frontend sends authenticated requests to backend (`/api/v1/admin/*`) with cookies.
2. Backend validates admin sessions using `admin_token` JWT cookie middleware.
3. Route handlers call controller/database logic (Prisma).
4. PostgreSQL stores business entities (stock, orders, payments, reports, etc.).
5. A daily cron job generates snapshots and daily aggregate reports.

## Core Backend Modules

- **Authentication & Admin Management**
- **Customers + Ledger + Financial Summary**
- **Raw Material Inventory** (IN/OUT/ADJUST, ledger, snapshots)
- **Finished Feed Inventory** (production, sale deduction, adjustments, snapshots)
- **Animal Types & Feed Categories**
- **Orders** (status transitions, delivery date updates)
- **Payments**
- **Refunds** (approve/reject)
- **Expenses**
- **Analytics** (dashboard stats)

## API Base Paths

- Health check: `GET /`
- Auth routes: `/api/v1/admin/auth/*`
- Protected admin routes: `/api/v1/admin/*`

## Backend Route Reference

### Auth (`/api/v1/admin/auth`)
- `POST /login`
- `POST /logout`
- `GET /info`
- `PUT /update`
- `GET /all`
- `PUT /update-admin/:id`
- `DELETE /delete/:id`
- `POST /create-admin`

### Customers (`/api/v1/admin/customers`)
- `POST /`
- `GET /phone`
- `GET /financial-summary`
- `GET /`
- `GET /:id`
- `GET /:id/total-due`
- `PUT /:id`
- `GET /:id/orders`
- `GET /:id/ledger`
- `GET /:id/snapshots`

### Raw Materials (`/api/v1/admin/raw-materials`)
- `GET /summary`
- `POST /`
- `GET /`
- `POST /:id/stock/in`
- `POST /:id/stock/out`
- `POST /:id/stock/adjust`
- `GET /:id/ledger`
- `GET /:id/snapshots`

### Finished Feed (`/api/v1/admin/finished-feed`)
- `GET /summary`
- `GET /stock`
- `POST /production`
- `POST /sale`
- `POST /adjust`
- `GET /:feedCategoryId/ledger`
- `GET /:feedCategoryId/snapshots`

### Animal Types (`/api/v1/admin/animal-types`)
- `POST /`
- `GET /`

### Feed Categories (`/api/v1/admin/feed-categories`)
- `POST /`
- `GET /`

### Orders (`/api/v1/admin/orders`)
- `GET /summary`
- `POST /`
- `GET /`
- `GET /:id`
- `PUT /:id/status`
- `PUT /:id/delivery-date`

### Payments (`/api/v1/admin/payments`)
- `POST /`
- `GET /orders/:id/payments`
- `GET /`

### Expenses (`/api/v1/admin/expenses`)
- `GET /`
- `POST /`
- `DELETE /:id`

### Refunds (`/api/v1/admin/refunds`)
- `GET /`
- `PUT /:id/approve`
- `PUT /:id/reject`

### Analytics (`/api/v1/admin/analytics`)
- `GET /stats`

## Database Model Highlights

Main entities include:

- `AdminUser`, `Customer`
- `RawMaterial`, `RawMaterialStockTransaction`, `RawMaterialDailySnapshot`
- `AnimalType`, `FeedCategory`, `FinishedFeedStock`, `FinishedFeedStockTransaction`, `FinishedFeedDailySnapshot`
- `ProductionBatch`, `ProductionBatchMaterial`
- `Order`, `OrderItem`, `Payment`, `Refund`, `Expense`
- `CustomerSummarySnapshot`, `DailyReport`

## Scheduled Jobs

Daily cron job (default `59 23 * * *`) generates:

- Raw material daily snapshots
- Finished feed daily snapshots
- Customer summary snapshots
- Global daily report metrics

## Frontend Pages (Admin Dashboard)

Main dashboard sections:

- Dashboard
- Raw Material Stock
- Finished Feed Stock
- Orders
- Refunds
- Customers
- Expenses
- Admins
- Settings
- Map

## Local Setup

### 1) Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Expected env vars:

- `DATABASE_URL`
- `PORT` (default in code: `8000`)
- `JWT_SECRET`

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

By default frontend API client points to:

- `http://localhost:8080/api/v1/admin`

Adjust frontend API base URL or backend port as needed for your environment.

## Available Scripts

### Backend
- `npm run dev` – start dev server with nodemon + ts-node
- `npm run build` – compile TypeScript
- `npm run start` – run compiled server
- `npm run seed` – run seed script
- `npm run lint` / `npm run lint:fix`

### Frontend
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

