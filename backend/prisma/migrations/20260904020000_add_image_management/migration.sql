-- Add image management fields to Product table
ALTER TABLE "Product" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "Product" ADD COLUMN "imagePublicId" TEXT;
