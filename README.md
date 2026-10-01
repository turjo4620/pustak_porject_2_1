<div align="center">

# 📚 পুস্তক · Pustak

### *Bangladesh's Online Bookstore — a full-stack, database-driven e-commerce platform*

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_Site-2ea44f?style=for-the-badge&logo=vercel&logoColor=white)](https://putak-porject-2-1.vercel.app)
[![Course](https://img.shields.io/badge/CSE_216-Database_Sessional-blueviolet?style=for-the-badge)]()
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)]()
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)]()
[![Node](https://img.shields.io/badge/Node.js-Express_5-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)]()
[![Made in Bangladesh](https://img.shields.io/badge/Made_in-Bangladesh_🇧🇩-006a4e?style=for-the-badge)]()

<br/>

**[🌐 Live Demo](https://putak-porject-2-1.vercel.app)** &nbsp;•&nbsp;
**[✨ Features](#-features)** &nbsp;•&nbsp;
**[🗄️ Database Design](#️-database-design)** &nbsp;•&nbsp;
**[🏗 Architecture](#-architecture)** &nbsp;•&nbsp;
**[🚀 Getting Started](#-getting-started)**

</div>

---

## 📖 About

**Pustak** (পুস্তক — *"book"* in Bangla) is a Bangla-first online bookstore built for Bangladeshi readers. Customers can discover books by author, publisher and category, build a cart and wishlist, apply coupons, pay by card, mobile banking or cash on delivery, track their orders, request returns and write reviews. Store admins get a complete back-office to manage the catalogue, stock, orders, returns, coupons, users and analytics.

> 🎓 **Academic Project** — Developed for the **CSE 216: Database Sessional** course. The emphasis is on solid relational design: normalised schema, constraints, indexes, triggers, stored procedures, functions, transactions and migrations, all wired to a real working application.

| | |
|---|---|
| **Course** | CSE 216 — Database Sessional |
| **Project** | Pustak — Online Bookstore |
| **Database** | PostgreSQL (hosted on Neon) |
| **Author** | Turjo ([@turjo4620](https://github.com/turjo4620)) |

---

## ✨ Features

### 🛍️ Storefront & Discovery

- **Rich home page** — hero banner, scrolling authors marquee, ranked bestsellers, top customers, newly released books, personalised recommendations, publisher showcase, category grid, author spotlight, reader reviews and newsletter signup.
- **Dedicated browsing pages** — Bestsellers, New Arrivals, Offers (discounted books), All Categories, Authors, Publishers.
- **Author, publisher & category pages** — each with its own book listing.
- **Search** — full catalogue search by query.
- **Filtering & sorting** (spec-driven, see [`.kiro/specs`](.kiro/specs/book-list-filtering-sorting/requirements.md)) — filter by category, author, publisher, price range and in-stock availability; sort by popularity, newest, price (low→high / high→low) and highest discount. Includes active filter chips, pagination and Bengali numeral formatting.
- **Book detail page** — full details, rating, reviews, add-to-cart, wishlist and *Buy Now*.
- **Large Bangla-first catalogue** — categories such as উপন্যাস, গল্প, কবিতা, ইতিহাস, ইসলামিক বই, শিশু-কিশোর, রহস্য-থ্রিলার, আত্ম-উন্নয়ন, programming and more, seeded with books from dozens of Bangladeshi, Indian and international authors.
- **Bilingual author handling** — an `author_aliases` table and merge migrations unify the same author written in Bangla and English.

### 🛒 Cart, Wishlist & Checkout

- **Persistent cart** — add, update quantity, remove (one cart per user, one line per book, quantity must be positive).
- **Wishlist** — toggle books in and out of a personal wishlist.
- **Address book** — save multiple delivery addresses and choose a default.
- **Coupons** — validated for usage limit, minimum and maximum order amount, and support both flat and percentage discounts.
- **Buy Now** — skip the cart and order a single book instantly.
- **Delivery charge** — stored per order along with courier and delivery status.

### 💳 Payments

Three payment methods, each modelled with its own table linked to a common `payments` record:

| Method | Details stored |
|---|---|
| 💳 **Card** | Last 4 digits, bank name, card brand (`card_payments`) |
| 📱 **Mobile Financial Services** | Sender mobile number, provider (`mfs_payments`) |
| 💵 **Cash on Delivery** | Collector and collection date (`cash_on_deliveries`) |

### 📦 Orders & Tracking

- **Atomic order placement** — runs in a transaction and reserves individual physical copies using `FOR UPDATE SKIP LOCKED`, so two customers can never buy the same copy.
- **5-step order tracking** in Bangla — অর্ডার গৃহীত → অর্ডার নিশ্চিত → প্যাকেজিং সম্পন্ন → পথে আছে → ডেলিভার্ড.
- **Order history & details** for every customer.
- **Order cancellation** — allowed while the order is Pending, Confirmed, Paid or Processing; reserved copies are automatically released back to stock.
- **Order success page** after checkout.

### ↩️ Returns & Refunds

- **7-day return window** from the delivery date.
- **Return reasons** — damaged book, wrong item received, defective print, missing pages, not as described, or other (with a custom note).
- **Admin approval workflow** via the `sp_approve_return` stored procedure: approves the return, creates a pending refund, and marks the copy as *damaged* or puts it back *in stock* depending on the reason.
- **Refund status tracking** managed by admins.

### ⭐ Reviews & Ratings

- Star rating (1–5) with a comment; one review per customer per book (resubmitting updates it).
- Book **average rating and review count are recalculated automatically**.
- Customers can view and manage their own reviews.
- Admins can hide, show or delete reviews.

### 👤 Customer Account

- Sign up / log in with **JWT authentication** and **bcrypt-hashed passwords**.
- Account dashboard with profile editing, password change and account deletion.
- Pages for **Orders, Wishlist, Returns, Reviews** and a **Best-Seller Rank** page showing the customer's rank among top buyers.
- Role-based access — customers and admins use separate logins and cannot cross over; suspended accounts cannot sign in.

### 📧 Newsletter

- Visitors can subscribe from the home page.
- Admins can send **email campaigns** (optionally with a coupon code) via SMTP / Resend.
- Every delivery is recorded in a `newsletter_delivery_log` with a `sent` / `failed` status.

### 🧑‍💼 Admin Panel

A protected `/admin` area with its own login and layout:

| Section | What admins can do |
|---|---|
| 📊 **Dashboard** | Totals for books, active users, authors, orders, reviews, revenue, pending orders, low-stock and out-of-stock counts |
| 📈 **Analytics** | Sales analytics, bestsellers, low-stock report |
| 📚 **Books** | Create, edit, delete books, upload cover image URL, adjust stock |
| ✍️ **Authors** | Full CRUD |
| 🏢 **Publications** | Full CRUD |
| 🗂️ **Categories** | Full CRUD |
| 🏷️ **Coupons** | Create, edit, delete, set limits and ranges |
| 👥 **Users** | View users and details, activate/suspend accounts, create new admin accounts |
| 🧾 **Orders** | View orders, assign couriers, update status |
| ↩️ **Returns** | Approve or reject returns, update refund status |
| 💬 **Reviews** | Moderate customer reviews |
| 🔐 **Account** | Admin profile settings |

Admin actions are tracked with `created_by` / `updated_by` audit columns on books, authors, publications, categories and coupons.

---

## 🗄️ Database Design

The heart of the project: a **normalised PostgreSQL schema** with **28+ tables**, versioned migrations and large seed datasets.

### Entity-Relationship Overview

```mermaid
erDiagram
    USERS ||--o| CART : has
    USERS ||--o| WISHLIST : has
    USERS ||--o{ ADDRESSES : saves
    USERS ||--o{ ORDERS : places
    USERS ||--o{ REVIEWS : writes
    CART ||--o{ CART_ITEM : contains
    WISHLIST ||--o{ WISHLIST_ITEM : contains
    BOOKS ||--o{ CART_ITEM : in
    BOOKS ||--o{ WISHLIST_ITEM : in
    BOOKS ||--o{ REVIEWS : receives
    BOOKS ||--o{ BOOK_COPY : "stocked as"
    BOOKS }o--|| PUBLICATIONS : "published by"
    BOOKS ||--o{ BOOK_AUTHOR : ""
    AUTHORS ||--o{ BOOK_AUTHOR : ""
    BOOKS ||--o{ BOOK_CATEGORY : ""
    CATEGORIES ||--o{ BOOK_CATEGORY : ""
    ORDERS ||--o{ ORDER_ITEM : contains
    BOOK_COPY ||--o{ ORDER_ITEM : sold
    ORDERS }o--o| COUPONS : uses
    ORDERS }o--|| ADDRESSES : "ships to"
    ORDERS ||--o{ PAYMENTS : "paid by"
    PAYMENTS ||--o| CARD_PAYMENTS : is
    PAYMENTS ||--o| MFS_PAYMENTS : is
    PAYMENTS ||--o| CASH_ON_DELIVERIES : is
    ORDERS ||--o{ DELIVERIES : "delivered via"
    COURIER ||--o{ DELIVERIES : handles
    ORDER_ITEM ||--o| RETURN : "may have"
    RETURN ||--o| REFUND : triggers
    ADMIN ||--o{ BOOKS : manages
```

### Main Tables

| Group | Tables |
|---|---|
| **Users** | `users`, `customer`, `admin`, `addresses`, `user_status_audit` |
| **Catalogue** | `books`, `book_copy`, `authors`, `author_aliases`, `book_author`, `categories`, `book_category`, `publications` |
| **Shopping** | `cart`, `cart_item`, `wishlist`, `wishlist_item`, `coupons` |
| **Orders & Payment** | `orders`, `order_item`, `payments`, `card_payments`, `mfs_payments`, `cash_on_deliveries`, `courier`, `deliveries` |
| **After-sales** | `return`, `refund`, `reviews` |
| **Marketing** | `newsletter_delivery_log` |

### 🔑 Database Concepts Demonstrated

| Concept | Where it's used |
|---|---|
| **Primary & foreign keys** | Every table, with referential integrity across users, books, orders, payments |
| **Many-to-many relations** | `book_author`, `book_category` junction tables |
| **Specialisation (ISA)** | `payments` → `card_payments` / `mfs_payments` / `cash_on_deliveries` |
| **Constraints** | `UNIQUE` (email, coupon code, order number, barcode, one cart/wishlist per user), `CHECK` (rating 1–5, quantity > 0, delivery log status) |
| **Sequences** | Dedicated sequences for IDs, with repair migrations |
| **Indexes** | Indexes on book title, category, author and cart items for faster lookups |
| **Triggers** | `trg_create_initial_book_copies` – creates stock rows when a book is added · `trg_sync_book_availability` – flips a book between *In Stock* / *Out of Stock* automatically · `trg_log_user_status_change` – audit log when a user's status changes |
| **Stored procedure** | `sp_approve_return` – approves a return, creates the refund and updates copy condition |
| **Stored function** | `fn_sales_summary(start, end)` – returns total orders, revenue and average order value |
| **Transactions & locking** | Order placement, cancellation and returns use `BEGIN/COMMIT` with `FOR UPDATE` / `SKIP LOCKED` |
| **Copy-level inventory** | Each physical copy is a row in `book_copy` (`in_stock`, `sold`, `damaged`) |
| **Aggregation & joins** | Dashboard stats, bestsellers, buyer rank, low-stock reports, rating averages |
| **Migrations** | 15 numbered migrations plus dated data-cleanup migrations |
| **Seed data** | 35+ seed files with books by many authors, publications, categories, dummy users and reviews |

---

## 🏗 Architecture

```mermaid
flowchart LR
    A[👤 Browser<br/>React + Vite SPA] -->|REST / JSON<br/>JWT Bearer| B[⚙️ Express 5 API<br/>Node.js]
    B -->|pg Pool · SSL| C[(🐘 PostgreSQL<br/>Neon)]
    B -->|SMTP / Resend| D[📧 Newsletter emails]
```

The backend follows a clean **Routes → Controllers → Services** layered structure, with middleware for authentication, admin authorisation and centralised error handling.

### 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 5, React Router 6, Framer Motion, Lucide React |
| **Backend** | Node.js, Express 5, `pg`, `jsonwebtoken`, `bcrypt` / `bcryptjs`, `cors`, `dotenv`, `nodemailer` |
| **Database** | PostgreSQL (Neon serverless) |
| **Email** | SMTP via Nodemailer, Resend |
| **Hosting** | Vercel (frontend) |
| **Planning** | Kiro specs for the filtering & sorting feature |

### 🔌 REST API Overview

| Prefix | Purpose |
|---|---|
| `/api/auth` | Signup, login, admin login, profile, change password, delete account |
| `/api/books` | Catalog, search, bestsellers, new arrivals, offers, by author / publisher / category |
| `/api/authors` · `/api/publications` · `/api/categories` | Public listing; admin-only create / update / delete |
| `/api/cart` · `/api/wishlist` · `/api/addresses` | Customer shopping data |
| `/api/coupons` | Validate coupons; admin management |
| `/api/orders` | Place order, buy-now, history, tracking, cancel, buyer rank |
| `/api/payments` | Pay for an order (card / MFS / COD) |
| `/api/returns` | Request and view returns |
| `/api/reviews` | Book reviews and the customer's own reviews |
| `/api/newsletter` | Subscribe; admin campaigns |
| `/api/admin` | Dashboard, books, users, orders, returns, reviews, analytics |

---

## 🗂 Project Structure

```text
pustak_porject_2_1/
│
├── 📁 database/
│   ├── schema/            # schema.sql, sequences.sql
│   ├── migrations/        # 001 → 015 + dated data-cleanup migrations (+ legacy/)
│   ├── seeds/             # books, authors, categories, publications, users, reviews
│   ├── functions/         # fn_sales_summary
│   ├── procedures/        # sp_approve_return
│   └── triggers/          # inventory sync, user status audit
│
├── 📁 pustak/
│   ├── Backend/
│   │   ├── server.js · index.js
│   │   └── src/
│   │       ├── routes/ · controllers/ · services/
│   │       ├── middlewares/   # auth, adminAuth, errorHandler
│   │       ├── config/        # PostgreSQL pool
│   │       └── utils/         # withTransaction
│   │
│   └── frontend/
│       └── src/
│           ├── pages/         # storefront, account dashboard, admin/
│           ├── components/    # BookCard, Hero, Filters, Navigation, ...
│           ├── context/       # AppContext (global state)
│           ├── hooks/ · api/ · utils/ · styles/
│
├── 📁 .kiro/specs/book-list-filtering-sorting/   # requirements for filter & sort
└── 📁 .vscode/
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [PostgreSQL](https://www.postgresql.org/) (local, or a free [Neon](https://neon.tech) database)
- Git

### 1️⃣ Clone

```bash
git clone https://github.com/turjo4620/pustak_porject_2_1.git
cd pustak_porject_2_1
```

### 2️⃣ Set up the database

Run the SQL files against your PostgreSQL database in this order:

```bash
# 1. Schema
psql "$DATABASE_URL" -f database/schema/sequences.sql
psql "$DATABASE_URL" -f database/schema/schema.sql

# 2. Triggers, function and procedure
psql "$DATABASE_URL" -f database/triggers/inventory.sql
psql "$DATABASE_URL" -f database/triggers/user_status_audit.sql
psql "$DATABASE_URL" -f database/functions/fn_sales_summary.sql
psql "$DATABASE_URL" -f database/procedures/sp_approve_return.sql

# 3. Migrations (in numeric order, 005 → 015)
# 4. Seed data from database/seeds/ (categories, publications, authors, books, ...)
```

> 💡 Check the `migrations/` folder for ordering. Run category and publication seeds before book seeds, since books reference them.

### 3️⃣ Start the backend

```bash
cd pustak/Backend
npm install
```

Create `pustak/Backend/.env`:

```env
DATABASE_URL=postgres://user:password@host/dbname
JWT_SECRET=your_long_random_secret
PORT=5000

# Newsletter emails (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@example.com
SMTP_PASSWORD=your_password
SMTP_FROM="Pustak <you@example.com>"
# or use Resend
RESEND_API_KEY=
RESEND_FROM=
```

```bash
npm run dev      # development (nodemon)
# or
npm start        # production
```

The API runs on **http://localhost:5000**. Visit `/api/test-db` to confirm the database connection.

### 4️⃣ Start the frontend

```bash
cd pustak/frontend
npm install
```

Create `pustak/frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

```bash
npm run dev
```

Open the URL Vite prints (usually **http://localhost:5173**) 🎉

### 5️⃣ Create an admin

Use the helper scripts in `pustak/Backend/` (for example `generate_admin_hash.js`) or the legacy `setup_admin.sql` migration to create your first admin, then sign in at `/admin/login`.

### 🏭 Production build

```bash
cd pustak/frontend
npm run build    # outputs to dist/
```

---

## 🌍 Deployment

- **Frontend** — deployed on Vercel at **https://putak-porject-2-1.vercel.app** (SPA rewrites are configured through `_redirects`).
- **Database** — Neon serverless PostgreSQL.
- To deploy your own copy, set the Vercel root directory to `pustak/frontend`, add `VITE_API_URL` pointing at your hosted API, and set `DATABASE_URL` and `JWT_SECRET` on your backend host.

---

## 🧭 Roadmap

- [x] Catalogue, search, filtering and sorting
- [x] Cart, wishlist, address book and coupons
- [x] Card / MFS / COD payments
- [x] Order tracking, cancellation, returns and refunds
- [x] Reviews with automatic rating updates
- [x] Newsletter campaigns
- [x] Full admin panel with analytics
- [ ] Real payment gateway integration (bKash, Nagad, SSLCommerz)
- [ ] English / Bangla language toggle
- [ ] Automated test suite
- [ ] Order confirmation emails

---

## 🙏 Acknowledgements

Built for the **CSE 216 (Database Sessional)** course. Thanks to the course teachers and instructors for their guidance and feedback throughout the term.

---

## 🤝 Contributing

Suggestions and bug reports are welcome — [open an issue](https://github.com/turjo4620/pustak_porject_2_1/issues) or submit a pull request.

1. Fork the repo
2. `git checkout -b feature/your-feature`
3. `git commit -m "Add: your feature"`
4. `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📜 License

No license is declared yet. Consider adding one (for example [MIT](https://choosealicense.com/licenses/mit/)).

---

## 👤 Author

**Turjo** — CSE 216 Database Sessional
GitHub: [@turjo4620](https://github.com/turjo4620)

---

<div align="center">

### ⭐ If you like this project, give it a star!

*Made with ❤️ and a love for books in Bangladesh 🇧🇩*

**পুস্তক — পড়ুন, জানুন, এগিয়ে যান।**

</div>
