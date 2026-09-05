# Bloom & Petal

A full-stack flower e-commerce platform built with **Next.js, NestJS, PostgreSQL, Prisma, and TypeScript**.

Bloom & Petal provides a complete shopping experience for customers while giving administrators a dedicated interface for managing products, categories, inventory, and orders.

## Features

### Customer

* Browse available flowers and plants
* Search and filter products
* Filter products by category and maximum price
* Sort products by price and other supported criteria
* View detailed product information
* Add and remove products from cart
* Update cart quantities
* Persistent shopping cart for authenticated customers
* Guest shopping cart with automatic expiry
* Merge guest cart into customer cart after login
* Customer registration and login
* JWT-based authentication
* View personal order history
* View individual order details
* Cancel eligible orders
* Responsive design for desktop and mobile

### Administration

* Dedicated admin portal
* Admin authentication and authorization
* Product management
* Category management
* Product image uploads through Cloudinary
* Product image deletion when supported by the product lifecycle
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
* Server-side order total calculation
* Server-side product pricing validation
* Atomic inventory updates
* Transactional order creation
* Protected order ownership
* Validated order status transitions
* Global request validation
* Rate limiting
* Helmet security headers
* Configurable CORS
* Safe database exception handling
* Environment-based configuration
* Seed credentials supplied through environment variables

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
* **Cloudinary**

### Infrastructure

* **Neon** — PostgreSQL database
* **Render** — backend deployment
* **Vercel** — frontend deployment
* **Cloudinary** — product image storage

## Project Structure

```text
Bloom-and-Petal/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── auth/
│   │   ├── categories/
│   │   ├── cloudinary/
│   │   ├── orders/
│   │   ├── products/
│   │   ├── users/
│   │   └── main.ts
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
└── README.md
```

## Getting Started

### Prerequisites

Make sure you have the following installed:

* Node.js
* npm
* PostgreSQL database
* Git

A Neon PostgreSQL database can be used for development.

### Clone the repository

```bash
git clone https://github.com/DanIzunna/Bloom-and-Petal.git
cd Bloom-and-Petal
```

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

SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="your_admin_password"
SEED_CUSTOMER_EMAIL="customer@example.com"
SEED_CUSTOMER_PASSWORD="your_customer_password"
```

Run Prisma migrations:

```bash
npx prisma migrate deploy
```

Generate the Prisma client:

```bash
npx prisma generate
```

To populate the development database with sample data:

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

## Authentication & Authorization

Bloom & Petal uses JWT-based authentication.

There are two primary roles:

* `CUSTOMER`
* `ADMIN`

Customers can browse products, manage their carts, and create and manage their own orders.

Administrators have access to the separate admin portal and can manage products, categories, inventory, and orders.

Administrative operations are protected on the server rather than relying solely on frontend restrictions.

## API Overview

The backend exposes RESTful endpoints under:

```text
/api
```

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/users/me
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

### Administration

```text
GET   /api/admin/orders
PATCH /api/admin/orders/:id/status
```

Administrative endpoints require appropriate authorization.

## Order & Inventory Handling

Orders are processed on the server using the current product prices stored in the database.

When an order is created:

1. Products and prices are retrieved from the database.
2. Requested quantities are validated.
3. The order total is calculated server-side.
4. Inventory is updated atomically.
5. The order and order items are created within a database transaction.

This prevents clients from manipulating product prices or bypassing inventory restrictions.

Order status transitions are also validated on the server.

## Cart Behaviour

Bloom & Petal supports both guest and authenticated shopping carts.

Guest carts are stored separately from authenticated customer carts and automatically expire after a defined period.

When a guest customer logs in, their existing cart can be merged into their authenticated customer cart.

Administrative users are prevented from using the customer checkout flow.

## Product Images

Product images are stored using Cloudinary rather than directly in the application server.

Supported image formats include:

* JPEG
* PNG
* WebP

Uploaded images are limited in size and stored within the Bloom & Petal Cloudinary product folder.

## Environment Variables

Never commit real credentials or secrets to the repository.

The following values should be provided through environment variables:

| Variable                 | Purpose                            |
| ------------------------ | ---------------------------------- |
| `DATABASE_URL`           | PostgreSQL connection string       |
| `JWT_SECRET`             | JWT signing secret                 |
| `FRONTEND_URL`           | Allowed frontend origin            |
| `PORT`                   | Backend server port                |
| `CLOUDINARY_CLOUD_NAME`  | Cloudinary account                 |
| `CLOUDINARY_API_KEY`     | Cloudinary API key                 |
| `CLOUDINARY_API_SECRET`  | Cloudinary API secret              |
| `SEED_ADMIN_EMAIL`       | Development seed admin email       |
| `SEED_ADMIN_PASSWORD`    | Development seed admin password    |
| `SEED_CUSTOMER_EMAIL`    | Development seed customer email    |
| `SEED_CUSTOMER_PASSWORD` | Development seed customer password |
| `NEXT_PUBLIC_API_URL`    | Frontend API base URL              |

Actual `.env` files should remain untracked.

## Deployment

The intended production architecture is:

```text
                    ┌───────────────┐
                    │    Vercel     │
                    │    Next.js    │
                    └───────┬───────┘
                            │
                            │ HTTPS
                            ▼
                    ┌───────────────┐
                    │    Render     │
                    │    NestJS     │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │     Neon      │
                    │  PostgreSQL   │
                    └───────────────┘

                    ┌───────────────┐
                    │  Cloudinary   │
                    │ Product Media │
                    └───────────────┘
```

The frontend and backend are deployed separately, while Neon provides the production PostgreSQL database.

Production secrets and environment variables should be configured through the hosting platforms rather than committed to Git.

## Development

Run the backend and frontend independently during development.

Backend:

```bash
cd backend
npm run start:dev
```

Frontend:

```bash
cd frontend
npm run dev
```

### Backend checks

```bash
npm run lint
npm run build
npm test
```

## Future Improvements

Planned improvements include:

* Paystack payment processing
* Email notifications
* Google authentication
* Additional order/payment workflows
* Improved product lifecycle management and archiving
* Expanded automated test coverage

These features are intentionally kept separate from the current MVP so that the core shopping and administration workflows remain stable.

## License

This project is currently intended as a portfolio/client demonstration project.

````

This is the version I'd use for the repo. **Don't add fake screenshots, fake test coverage, or claims about features you haven't implemented.** Once you've pasted it into `README.md`, commit it separately:

```powershell
git add README.md
git commit -m "docs: add project README"
git push
````

Then your GitHub repository will have a proper project presentation, and we can move straight into **Render deployment**.
