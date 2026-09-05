-- Add a temporary nullable slug column so existing products can be backfilled safely.
ALTER TABLE "Product" ADD COLUMN "slug" TEXT;

-- Derive URL-safe slugs from existing product names.
UPDATE "Product"
SET "slug" = trim(both '-' from regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g'));

-- Resolve any name collisions deterministically before enforcing uniqueness.
WITH duplicates AS (
  SELECT "id", "slug", row_number() OVER (PARTITION BY "slug" ORDER BY "id") AS position
  FROM "Product"
)
UPDATE "Product" AS product
SET "slug" = duplicates."slug" || '-' || duplicates.position
FROM duplicates
WHERE product."id" = duplicates."id" AND duplicates.position > 1;

ALTER TABLE "Product" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
