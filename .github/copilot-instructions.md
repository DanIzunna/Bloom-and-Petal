# Flower E-Commerce Project (Bloom Store) Rules

## Tech Stack

- Frontend: Next.js (App Router), TypeScript, Tailwind CSS, Lucide React icons
- Backend: NestJS, TypeScript, REST API
- Database & ORM: PostgreSQL, Prisma ORM
- Auth: JWT + bcrypt (passwords)

## Business Context

- Domain: Flower & Floral Arrangements Store (Fresh Bouquets, Houseplants, Occasion Flowers, Vases).
- Key Product Features: Flower colors, occasion tags (Birthday, Anniversary, Sympathy), care instructions, fresh bloom status/availability.

## Code Style & Rules

1. Backend (NestJS):
   - Modular layout (`src/<feature>/<feature>.module.ts`).
   - Validate input DTOs with `class-validator`.
   - Standard API response format: `{ success: boolean, data: T, message?: string }`.
2. Frontend (Next.js):
   - Clean, elegant floral-themed design using Tailwind CSS (soft pastels, rich greens, rose pinks, warm cream tones).
   - Use Lucide icons for cart, search, user profiles, and flower tags.
   - Use Next.js App Router.
   - Server Components by default; Client Components (`'use client'`) for interactive components (cart, filter sidebar, checkout).
