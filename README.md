# Pustak

Pustak is a full-stack online bookstore for browsing, purchasing, reviewing, and managing books. It provides a Bengali-first customer storefront, a protected customer account area, and an administrative dashboard for catalog, order, inventory, user, and promotion management.

The project consists of a React single-page application, an Express REST API, and PostgreSQL database scripts. The API is configured for a PostgreSQL-compatible hosted database (the current connection log identifies Neon).

## Highlights

- Browse, search, filter, sort, and paginate the book catalog.
- Explore books by author, category, publisher, best-seller, new-arrival, and offer collections.
- Customer authentication, profile management, saved addresses, cart, wishlist, checkout, payments, orders, delivery tracking, returns, and reviews.
- Responsive Bengali-oriented storefront with dark-mode preference persistence.
- Admin authentication and dashboard tools for books, authors, publications, categories, coupons, users, orders, returns/refunds, reviews, stock, and analytics.
- Inventory-aware book copies, order processing, delivery data, coupons, newsletter campaigns, return/refund handling, audit fields, triggers, functions, and procedures.

## Technology

| Area | Technologies |
| --- | --- |
| Frontend | React 18, React Router 6, Vite 5, Framer Motion, Lucide React |
| Backend | Node.js, Express 5, `pg`, JWT, bcrypt, Nodemailer, CORS |
| Database | PostgreSQL / Neon-compatible PostgreSQL, PL/pgSQL |
| Local development | npm and Nodemon |

## Repository layout

```text
.
├── database/
│   ├── schema/          # Base table definitions and sequences
│   ├── migrations/      # Incremental database changes
│   ├── seeds/           # Catalog, publication, review, user, and book data
│   ├── functions/       # Reporting/database functions
│   ├── procedures/      # Operational stored procedures
│   └── triggers/        # Inventory-related trigger definitions
└── pustak/
    ├── Backend/
    │   ├── src/config/       # PostgreSQL connection
    │   ├── src/controllers/  # HTTP request handlers
    │   ├── src/services/     # Business and data-access logic
    │   ├── src/routes/       # REST endpoint definitions
    │   └── src/middlewares/  # Authentication and error handling
    └── frontend/
        ├── src/components/   # Shared storefront components
        ├── src/pages/        # Customer and admin views
        ├── src/context/      # Application state
        └── src/api/          # Browser API client
```

## Prerequisites

- Node.js 18 or newer and npm.
- A PostgreSQL database (local PostgreSQL or a hosted PostgreSQL provider such as Neon).
- `psql` is recommended for applying the SQL scripts.

## Quick start

The repository has separate frontend and backend npm projects. Open two terminals at the repository root.

### 1. Configure and start the API

```powershell
cd pustak/Backend
npm ci
```

Create `pustak/Backend/.env` with values appropriate for your environment:

```dotenv
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
JWT_SECRET=replace-with-a-long-random-secret

# Required when using newsletter delivery
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_FROM="Pustak <no-reply@example.com>"
```

Start the API:

```powershell
npm start
```

For automatic restarts while editing backend code:

```powershell
npm run dev
```

The server listens on `http://localhost:5000` unless `PORT` is changed. Verify its database connection with:

```powershell
Invoke-RestMethod http://localhost:5000/api/test-db
```

### 2. Configure the database

Create a database, then apply the SQL assets with `psql`. The SQL directory contains both a baseline schema and changes that evolved an existing project database.

```powershell
psql "$env:DATABASE_URL" -f database/schema/schema.sql
psql "$env:DATABASE_URL" -f database/schema/sequences.sql
psql "$env:DATABASE_URL" -f database/triggers/inventory.sql
psql "$env:DATABASE_URL" -f database/functions/fn_sales_summary.sql
psql "$env:DATABASE_URL" -f database/procedures/sp_approve_return.sql
```

Then apply the numbered files in `database/migrations/` in ascending order. The three `20260925_*` files are data-cleanup migrations and should run after the numbered migrations. Load only the seed data you need from `database/seeds/`; the folders are organized by books, catalog data, and publications.

> **Important:** The schema and migrations were collected from an evolving database rather than a single migration runner. Before initializing a brand-new production database, apply them to a disposable database first, resolve any dependency/order issues for your PostgreSQL version, and record the exact order used. Never run cleanup or seed scripts against production without reviewing them.

### 3. Configure and start the frontend

```powershell
cd pustak/frontend
npm ci
npm run dev
```

Vite serves the application at `http://localhost:5173` by default.

The frontend includes `VITE_API_URL` in its local `.env`, but the active browser client currently uses the deployed API constant in `src/api/http.js`. The Vite `/api` proxy therefore only affects requests that use relative `/api` URLs. To develop against a local API, update `API_BASE` in `src/api/http.js` to `http://localhost:5000/api` (or refactor it to use `import.meta.env.VITE_API_URL`) before starting the frontend.

## Available commands

Run these from the relevant project directory.

| Directory | Command | Purpose |
| --- | --- | --- |
| `pustak/Backend` | `npm start` | Start the API through `index.js`. |
| `pustak/Backend` | `npm run dev` | Start the API with Nodemon. |
| `pustak/Backend` | `npm test` | Placeholder command; no automated test suite is configured. |
| `pustak/frontend` | `npm run dev` | Start the Vite development server. |
| `pustak/frontend` | `npm run build` | Produce a production build in `dist/`. |
| `pustak/frontend` | `npm run preview` | Preview the production build locally. |

## Application areas

### Customer storefront

Public pages include the home page, catalog search, book details, categories, authors, publishers, best sellers, new arrivals, and offers. The storefront supports list filtering by category, author, publisher, price, availability, and sort order. Customer-only routes cover the cart, checkout/payment flow, account profile, orders, wishlist, reviews, returns, and buyer rank.

### Administrator dashboard

Admin users sign in at `/admin/login`. The dashboard exposes catalog CRUD, stock updates, customer status administration, order and delivery status administration, review moderation, return/refund handling, coupons, analytics, low-stock reporting, and admin account management. Administrative endpoint access is enforced with a Bearer JWT.

## API overview

All API routes are rooted at `/api`. Requests needing authentication send `Authorization: Bearer <token>`.

| Area | Base path | Typical capabilities |
| --- | --- | --- |
| Authentication | `/auth` | Sign up, customer/admin login, current profile, password change, account deletion |
| Books | `/books` | Catalog, search, best sellers, new arrivals, offers, book detail, author/publisher/category listings |
| Catalog metadata | `/authors`, `/categories`, `/publications` | Public lookup and admin CRUD |
| Shopping | `/cart`, `/wishlist`, `/coupons`, `/addresses` | Cart items, wishlists, coupon validation, saved addresses |
| Orders & payments | `/orders`, `/payments` | Checkout, buy-now, order history/detail, cancellation, tracking, payment submission |
| Customer engagement | `/reviews`, `/returns`, `/newsletter` | Reviews, returns, subscription, campaigns |
| Administration | `/admin` | Dashboard, catalog/admin users, orders, returns, reviews, stock, and analytics |
| Public statistics | `/public/top-customers` | Landing-page customer leaderboard |

Useful health checks:

```text
GET /                         # API welcome response
GET /api/test-db              # Database connectivity check
GET /api/books/catalog        # Catalog response
```

## Database capabilities

The database models users and admin roles, authors and aliases, publications, categories, books and physical copies, carts/wishlists, orders/items, payment variants, delivery/courier tracking, reviews, returns/refunds, addresses, coupons, newsletters, and audit information.

Notable database behavior includes:

- `trg_create_initial_book_copies` creates book-copy inventory from a new book's initial stock.
- `trg_sync_book_availability` keeps a book's availability aligned with its in-stock copies while preserving pre-order status.
- `fn_sales_summary(start, end)` returns total orders, revenue, and average order value for a time range.
- `sp_approve_return(return_id)` approves a return, creates its refund record, and marks damaged copies appropriately.

## Authentication and secrets

- Do not commit `.env` files, database URLs, JWT secrets, SMTP passwords, or generated credentials. Both application `.gitignore` files exclude `.env` and `node_modules`.
- Use a separate database and a unique `JWT_SECRET` for every environment.
- SMTP settings are required only for routes that send newsletter mail, but should be present before running campaigns.
- The current CORS configuration accepts requests from any origin. Restrict it to known frontend origins before deploying a production service.

## Production notes

1. Run `npm run build` in `pustak/frontend` and deploy the generated `dist/` directory to a static host that rewrites unknown routes to `index.html`. The included `public/_redirects` supports this on compatible hosts.
2. Deploy the Express service with all backend environment variables configured by the host, not by a committed `.env` file.
3. Point the frontend API client at the deployed API, ensure the API CORS allow-list contains the storefront origin, and verify `GET /api/test-db` after deployment.
4. Apply reviewed schema changes and backups through a controlled database migration process.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| API exits immediately | `DATABASE_URL` must be defined before the server starts. Confirm the backend `.env` is in `pustak/Backend/`. |
| `/api/test-db` returns 500 | Verify the connection string, database network access, TLS requirements, and that the schema is installed. |
| Frontend calls the wrong server | Check the `API_BASE` value in `pustak/frontend/src/api/http.js`; it currently targets the deployed API. |
| A protected route redirects to login | Sign in again and confirm the browser has the expected authentication token. |
| Admin requests return authorization errors | Use an admin account and its admin Bearer token; customer tokens are not sufficient. |
| Database script fails on a new database | Review dependency order and run the script against an empty disposable database first; the SQL assets have historical dependencies. |

## Contributing

1. Create a focused branch.
2. Install dependencies in both application directories.
3. Keep controller logic thin and place reusable data/business logic in the backend service layer.
4. Test affected customer and admin flows, then run `npm run build` from `pustak/frontend` before submitting changes.
5. Include any schema, migration, seed, or environment-variable changes in your pull request description.

## License

No project license has been specified. Add a license file before redistributing the code.
