# Bloom & Petal

A full-stack flower e-commerce platform built with **Next.js, NestJS, PostgreSQL, Prisma, and TypeScript**.

Bloom & Petal provides a complete shopping experience for customers, backed by a secure REST API and a dedicated administration interface for managing products, categories, inventory, and orders.

**Live Demo:** https://bloom-and-petal.vercel.app/
**Backend API:** https://bloom-and-petal-api.onrender.com/api
**GitHub:** https://github.com/DanIzunna/Bloom-and-Petal

---

## Features

### Customer

* Browse flowers and plants
* Search and filter products
* Filter products by category and maximum price
* Sort products by supported criteria
* View detailed product information
* Add products to cart
* Update cart quantities
* Remove products from cart
* Persistent shopping cart for authenticated customers
* Guest shopping cart with automatic expiry
* Merge guest cart into authenticated customer cart after login
* Customer registration and login
* JWT-based authentication
* Secure checkout with Stripe
* View personal order history
* View individual order details
* Track order status
* Cancel eligible orders
* Custom branded 404 experience
* Responsive desktop and mobile interface

### Administration

* Dedicated admin interface
* Admin authentication and authorization
* Product management
* Category management
* Product image uploads through Cloudinary
* Product image deletion
* Inventory management
* Order management
* Order status updates
* Dashboard metrics
* Protected administrative API endpoints

### Backend & Security

* RESTful API built with NestJS
* PostgreSQL database hosted on Neon
* Prisma ORM with PostgreSQL adapter
* JWT authentication
* Password hashing with bcrypt
* Role-based authorization
* Server-side product and price validation
* Server-side order total calculation
* Atomic inventory updates
* Transactional order processing
* Stripe PaymentIntent integration
* Stripe webhook handling
* Payment and order state synchronization
* Protected order ownership
* Validated order status transitions
* Global request validation
* Rate limiting
* Helmet security headers
* Configurable CORS
* Safe database exception handling
* Environment-based configuration
* Automated backend tests
* GitHub Actions CI

---

## Payment Flow

Bloom & Petal uses Stripe for payment processing.

The payment flow is designed so that important pricing, inventory, payment, and order operations are handled on the backend rather than trusted from the client.

```text
Customer Cart
     │
     ▼
POST /payments/intent
     │
     ▼
Backend validates products,
prices and inventory
     │
     ▼
Create pending Payment
and PaymentItems snapshot
     │
     ▼
Create Stripe PaymentIntent
     │
     ▼
Return client secret
     │
     ▼
Stripe Checkout
     │
     ▼
Stripe Webhook
payment_intent.succeeded
     │
     ▼
Backend transaction
     │
     ├── Create Order
     └── Decrement Inventory
     │
     ▼
Order Confirmation
```

The Stripe webhook is treated as the authoritative payment confirmation rather than relying solely on the frontend payment result.

---

## Order Management

Orders use a controlled status lifecycle:

```text
PENDING
   │
   ├── PROCESSING
   │      │
   │      ├── DELIVERED
   │      └── CANCELLED
   │
   └── CANCELLED
```

Terminal states are:

* `DELIVERED`
* `CANCELLED`

Order status transitions are validated on the server.

Customers can only access their own orders, while administrators can manage orders through protected administrative endpoints.

---

## Cart Behaviour

Bloom & Petal supports both guest and authenticated shopping carts.

### Guest customers

Guest cart data is stored separately and automatically expires after a defined period.

### Authenticated customers

Authenticated customers have a persistent cart associated with their account.

### Cart merging

When a guest customer signs in, their guest cart can be merged into their authenticated customer cart.

The backend remains responsible for validating product availability and quantities during checkout.

---

## Product Images

Product images are managed through **Cloudinary** rather than being stored directly on the application server.

Supported formats include:

* JPEG
* PNG
* WebP

Images are stored in the Bloom & Petal Cloudinary product folder and can be deleted when products are removed or their media is replaced.

---

## Tech Stack

### Frontend

* **Next.js**
* **React**
* **TypeScript**
* **Tailwind CSS**
* **Zustand**
* **Lucide React**
* **Poppins**

### Backend

* **NestJS**
* **TypeScript**
* **Prisma**
* **PostgreSQL**
* **JWT**
* **bcrypt**
* **Stripe**
* **Cloudinary**

### Testing & CI

* **Jest**
* **GitHub Actions**

### Infrastructure

* **Vercel** — frontend deployment
* **Render** — backend deployment
* **Neon** — PostgreSQL database
* **Cloudinary** — product media
* **Stripe** — payment processing

---

## Architecture

```text
                         ┌─────────────────────┐
                         │       Vercel        │
                         │      Next.js        │
                         │      Frontend       │
                         └──────────┬──────────┘
                                    │
                                    │ HTTPS
                                    ▼
                         ┌─────────────────────┐
                         │       Render        │
                         │      NestJS API     │
                         └──────┬───────┬──────┘
                                │       │
                         ┌──────┘       └──────────────┐
                         ▼                             ▼
                ┌─────────────────┐           ┌─────────────────┐
                │      Neon       │           │     Stripe      │
                │   PostgreSQL    │           │    Payments     │
                └─────────────────┘           └─────────────────┘

                         ┌─────────────────┐
                         │   Cloudinary    │
                         │  Product Media  │
                         └─────────────────┘
```

The frontend communicates with the NestJS REST API over HTTPS.

The backend communicates with PostgreSQL through Prisma and handles authentication, authorization, business logic, inventory, orders, and payments.

---

## Project Structure

```text
Bloom-and-Petal/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   │
│   ├── src/
│   │   ├── auth/
│   │   ├── categories/
│   │   ├── cloudinary/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── products/
│   │   ├── users/
│   │   └── main.ts
│   │
│   ├── package.json
│   └── ...
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── store/
│   ├── types/
│   ├── package.json
│   └── ...
│
├── .github/
│   └── workflows/
│       └── backend-ci.yml
│
└── README.md
```

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

* Node.js 22+
* npm
* Git
* A PostgreSQL database

A Neon PostgreSQL database can be used for development.

---

## Clone the Repository

```bash
git clone https://github.com/DanIzunna/Bloom-and-Petal.git
cd Bloom-and-Petal
```

---

## Backend Setup

Navigate to the backend:

```bash
cd backend
npm install
```

Create a `.env` file:

```env
DATABASE_URL="your_database_url"
JWT_SECRET="your_jwt_secret"
FRONTEND_URL="http://localhost:3000"
PORT=3001

CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

STRIPE_SECRET_KEY="your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"

SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="your_admin_password"
SEED_CUSTOMER_EMAIL="customer@example.com"
SEED_CUSTOMER_PASSWORD="your_customer_password"
```

Run the database migrations:

```bash
npx prisma migrate deploy
```

Generate the Prisma client:

```bash
npx prisma generate
```

Populate the development database with sample data:

```bash
npx prisma db seed
```

Start the backend:

```bash
npm run start:dev
```

The API will be available at:

```text
http://localhost:3001/api
```

---

## Frontend Setup

Open another terminal and navigate to the frontend:

```bash
cd frontend
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at:

```text
http://localhost:3000
```

---

## Authentication & Authorization

Bloom & Petal uses JWT-based authentication with two primary roles:

* `CUSTOMER`
* `ADMIN`

Customers can:

* Register and log in
* Manage their cart
* Create orders
* View their own orders
* Cancel eligible orders

Administrators can:

* Manage products
* Manage categories
* Manage inventory
* Manage orders
* Update order statuses
* View dashboard metrics

Administrative authorization is enforced on the backend rather than relying solely on frontend route protection.

---

## API Overview

The backend exposes RESTful endpoints under:

```text
/api
```

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
```

### Users

```text
GET /api/users/me
```

### Products

```text
GET    /api/products
GET    /api/products/:id
POST   /api/products
PATCH  /api/products/:id
DELETE /api/products/:id
```

### Categories

```text
GET    /api/categories
GET    /api/categories/:id
POST   /api/categories
PATCH  /api/categories/:id
DELETE /api/categories/:id
```

### Orders

```text
POST /api/orders
GET  /api/orders
GET  /api/orders/:id
```

### Payments

```text
POST /api/payments/intent
POST /api/payments/webhook
```

### Administration

```text
GET   /api/admin/orders
PATCH /api/admin/orders/:id/status
```

Administrative endpoints require appropriate authorization.

---

## Order & Inventory Handling

Important ecommerce calculations are performed on the server.

When an order is processed:

1. Product information is retrieved from the database.
2. Product availability is validated.
3. Current prices are validated server-side.
4. The order total is calculated by the backend.
5. Inventory is updated atomically.
6. The order and order items are persisted transactionally.

This prevents clients from manipulating product prices or bypassing inventory restrictions.

Payment confirmation is handled through Stripe webhooks before the corresponding order is finalized.

---

## Validation & Security

The backend includes several layers of protection:

* JWT authentication
* Role-based authorization
* Password hashing with bcrypt
* Request validation
* Rate limiting
* Helmet security headers
* Configurable CORS
* Protected order ownership
* Server-side price validation
* Server-side inventory validation
* Atomic inventory updates
* Validated order status transitions
* Safe database exception handling
* Environment-based secrets

The frontend is treated as an untrusted client for business-critical operations.

---

## Testing

The backend uses Jest for automated testing.

Current test coverage includes service-level and application-level tests for important backend behaviour, including orders and payments.

Run the test suite:

```bash
npm test
```

Build the backend:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

The current test suite contains:

```text
3 test suites
48 tests
48 passing
```

---

## Continuous Integration

GitHub Actions runs backend checks automatically for pushes and pull requests targeting the main branches.

The CI workflow:

1. Checks out the repository
2. Sets up Node.js
3. Installs dependencies with `npm ci`
4. Runs the Jest test suite
5. Builds the backend

Workflow:

```text
.github/workflows/backend-ci.yml
```

This helps catch broken builds and failing backend tests before changes are merged.

---

## Environment Variables

Never commit real credentials or secrets to the repository.

### Backend

| Variable                 | Purpose                            |
| ------------------------ | ---------------------------------- |
| `DATABASE_URL`           | PostgreSQL connection string       |
| `JWT_SECRET`             | JWT signing secret                 |
| `FRONTEND_URL`           | Allowed frontend origin            |
| `PORT`                   | Backend server port                |
| `CLOUDINARY_CLOUD_NAME`  | Cloudinary account                 |
| `CLOUDINARY_API_KEY`     | Cloudinary API key                 |
| `CLOUDINARY_API_SECRET`  | Cloudinary API secret              |
| `STRIPE_SECRET_KEY`      | Stripe secret API key              |
| `STRIPE_WEBHOOK_SECRET`  | Stripe webhook signing secret      |
| `SEED_ADMIN_EMAIL`       | Development seed admin email       |
| `SEED_ADMIN_PASSWORD`    | Development seed admin password    |
| `SEED_CUSTOMER_EMAIL`    | Development seed customer email    |
| `SEED_CUSTOMER_PASSWORD` | Development seed customer password |

### Frontend

| Variable              | Purpose              |
| --------------------- | -------------------- |
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

Actual `.env` and `.env.local` files should remain untracked.

---

## Deployment

The production architecture is:

```text
Vercel
  │
  │ HTTPS
  ▼
Render
  │
  ▼
Neon PostgreSQL
```

Supporting services:

```text
Cloudinary → Product images
Stripe     → Payments and webhooks
```

Production environment variables and secrets are configured through the respective hosting platforms rather than committed to Git.

---

## Screenshots

Screenshots of the application will be added here.

### Customer Storefront

<img width="1920" height="1080" alt="home" src="https://github.com/user-attachments/assets/a084ff57-486f-4470-a5cb-53f740b44e53" />


<img width="1920" height="1080" alt="products" src="https://github.com/user-attachments/assets/569f22d5-81ad-4390-a5a8-d845731e2765" />

<img width="1920" height="1080" alt="product-detail" src="https://github.com/user-attachments/assets/9441aad7-158c-4df2-9fab-cfc7aa82f0c8" />


### Shopping & Orders

<img width="1920" height="1080" alt="cart" src="https://github.com/user-attachments/assets/d7d36ac1-8461-4728-a4f0-47bcfb93bb76" />


<img width="1920" height="1080" alt="order-track" src="https://github.com/user-attachments/assets/f8f41bc2-a6d3-4891-bfce-1e0caecace49" />

### Administration

<img width="1920" height="1080" alt="admin-dash" src="https://github.com/user-attachments/assets/56a2f809-47d4-4114-beed-e9ef45c0ab1a" />

<img width="1920" height="1080" alt="admin-order-detail" src="https://github.com/user-attachments/assets/4c871ca4-0056-4687-b896-05ccd6e71000" />

---

## Engineering Highlights

Bloom & Petal was built with a focus on backend correctness and realistic ecommerce workflows rather than treating the application as a purely visual storefront.

Some of the main engineering considerations include:

* Separating frontend presentation from backend business logic
* Validating prices and inventory on the server
* Preventing customers from accessing other customers' orders
* Handling payment confirmation through Stripe webhooks
* Using database transactions for order processing
* Performing atomic inventory updates
* Enforcing role-based access control
* Handling guest-to-authenticated cart merging
* Protecting API endpoints with validation and rate limiting
* Testing critical backend services
* Running automated tests and builds through GitHub Actions

---

## Future Improvements

Possible future improvements include:

* Email notifications for order events
* Additional payment and refund workflows
* Product archiving and improved product lifecycle management
* Expanded automated test coverage
* Additional customer account features
* More advanced analytics

These features are outside the current project scope and were intentionally left out to keep the core ecommerce workflow focused and stable.

---

## License

This project is currently intended as a **portfolio/client demonstration project**.
