import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  if (
    process.env.NODE_ENV === 'production' &&
    (!process.env.SEED_ADMIN_PASSWORD || !process.env.SEED_CUSTOMER_PASSWORD)
  ) {
    throw new Error(
      'SEED_ADMIN_PASSWORD and SEED_CUSTOMER_PASSWORD are required in production',
    );
  }
  // --------------------------------------------------
  // USERS
  // --------------------------------------------------

  const adminPassword = await bcrypt.hash(
    process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!',
    10,
  );

  await prisma.user.upsert({
    where: {
      email: process.env.SEED_ADMIN_EMAIL ?? 'admin@bloomstore.local',
    },
    update: {
      name: 'Store Admin',
      password: adminPassword,
      role: 'ADMIN',
    },
    create: {
      email: process.env.SEED_ADMIN_EMAIL ?? 'admin@bloomstore.local',
      name: 'Store Admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const customerPassword = await bcrypt.hash(
    process.env.SEED_CUSTOMER_PASSWORD ?? 'Customer123!',
    10,
  );

  await prisma.user.upsert({
    where: {
      email: process.env.SEED_CUSTOMER_EMAIL ?? 'customer@bloomstore.local',
    },
    update: {
      name: 'Demo Customer',
      password: customerPassword,
      role: 'CUSTOMER',
    },
    create: {
      email: process.env.SEED_CUSTOMER_EMAIL ?? 'customer@bloomstore.local',
      name: 'Demo Customer',
      password: customerPassword,
      role: 'CUSTOMER',
    },
  });

  // --------------------------------------------------
  // CATEGORIES
  // --------------------------------------------------

  const bouquets = await prisma.category.upsert({
    where: { name: 'Bouquets' },
    update: {
      slug: 'bouquets',
    },
    create: {
      name: 'Bouquets',
      slug: 'bouquets',
    },
  });

  const indoorPlants = await prisma.category.upsert({
    where: { name: 'Indoor Plants' },
    update: {
      slug: 'indoor-plants',
    },
    create: {
      name: 'Indoor Plants',
      slug: 'indoor-plants',
    },
  });

  const sympathy = await prisma.category.upsert({
    where: { name: 'Sympathy' },
    update: {
      slug: 'sympathy',
    },
    create: {
      name: 'Sympathy',
      slug: 'sympathy',
    },
  });

  const birthday = await prisma.category.upsert({
    where: { name: 'Birthday' },
    update: {
      slug: 'birthday',
    },
    create: {
      name: 'Birthday',
      slug: 'birthday',
    },
  });

  const driedFlowers = await prisma.category.upsert({
    where: { name: 'Dried Flowers' },
    update: {
      slug: 'dried-flowers',
    },
    create: {
      name: 'Dried Flowers',
      slug: 'dried-flowers',
    },
  });

  // --------------------------------------------------
  // PRODUCTS
  // --------------------------------------------------

  await prisma.product.upsert({
    where: { name: 'Red Rose Bouquet' },
    update: {
      images: [
        'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=85',
      ],
    },
    create: {
      name: 'Red Rose Bouquet',
      slug: 'red-rose-bouquet',
      description:
        'A classic bouquet of vibrant red roses, perfect for expressing love and passion.',
      price: 49.99,
      stock: 50,
      images: [
        'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=85',
      ],
      careInstructions:
        'Keep in cool water, trim stems daily, avoid direct sunlight.',
      occasion: 'Anniversary, Love & Romance',
      categoryId: bouquets.id,
    },
  });

  await prisma.product.upsert({
    where: { name: 'Monstera Deliciosa' },
    update: {
      images: [
        'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=1200&q=85',
      ],
    },
    create: {
      name: 'Monstera Deliciosa',
      slug: 'monstera-deliciosa',
      description:
        'A popular indoor plant with large, glossy, heart-shaped leaves that develop characteristic splits as they mature.',
      price: 35.0,
      stock: 20,
      images: [
        'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=1200&q=85',
      ],
      careInstructions:
        'Bright indirect light, water when the top inch of soil is dry.',
      occasion: 'Housewarming, Office Decor',
      categoryId: indoorPlants.id,
    },
  });

  await prisma.product.upsert({
    where: { name: 'Pastel Tulip Arrangement' },
    update: {
      images: [
        'https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=1200&q=85',
      ],
    },
    create: {
      name: 'Pastel Tulip Arrangement',
      slug: 'pastel-tulip-arrangement',
      description:
        'A delicate arrangement of fresh tulips in soft pastel hues, bringing a touch of spring to any space.',
      price: 55.0,
      stock: 30,
      images: [
        'https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=1200&q=85',
      ],
      careInstructions:
        'Keep in cool water, avoid direct sunlight, trim stems regularly.',
      occasion: 'Easter, Spring Decor',
      categoryId: bouquets.id,
    },
  });

  await prisma.product.upsert({
    where: { name: 'White Lily Sympathy Spray' },
    update: {
      images: [
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=85',
      ],
    },
    create: {
      name: 'White Lily Sympathy Spray',
      slug: 'white-lily-sympathy-spray',
      description:
        'A dignified arrangement of white lilies, often chosen to convey sympathy and peace.',
      price: 85.0,
      stock: 15,
      images: [
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=85',
      ],
      careInstructions: 'Keep hydrated and place in a cool area.',
      occasion: 'Sympathy, Funeral',
      categoryId: sympathy.id,
    },
  });

  await prisma.product.upsert({
    where: { name: 'Birthday Flower Basket' },
    update: {
      images: [
        'https://images.unsplash.com/photo-1455659817273-f96807779a8a?auto=format&fit=crop&w=1200&q=85',
      ],
    },
    create: {
      name: 'Birthday Flower Basket',
      slug: 'birthday-flower-basket',
      description:
        'A vibrant assortment of seasonal flowers in a charming basket, perfect for celebrating birthdays.',
      price: 60.0,
      stock: 25,
      images: [
        'https://images.unsplash.com/photo-1455659817273-f96807779a8a?auto=format&fit=crop&w=1200&q=85',
      ],
      careInstructions: 'Water regularly and keep in bright indirect light.',
      occasion: 'Birthday',
      categoryId: birthday.id,
    },
  });

  await prisma.product.upsert({
    where: { name: 'Eucalyptus and Lavender Dried Bouquet' },
    update: {
      images: [
        'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=1200&q=85',
      ],
    },
    create: {
      name: 'Eucalyptus and Lavender Dried Bouquet',
      slug: 'eucalyptus-and-lavender-dried-bouquet',
      description:
        'A fragrant and long-lasting dried bouquet featuring eucalyptus and lavender, ideal for rustic decor.',
      price: 30.0,
      stock: 40,
      images: [
        'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=1200&q=85',
      ],
      careInstructions: 'Keep dry and avoid direct sunlight to preserve color.',
      occasion: 'Home Decor, Gift',
      categoryId: driedFlowers.id,
    },
  });

  await prisma.product.upsert({
    where: { name: 'Orchid Phalaenopsis' },
    update: {
      images: [
        'https://images.unsplash.com/photo-1455582916367-25f75bfc6710?auto=format&fit=crop&w=1200&q=85',
      ],
    },
    create: {
      name: 'Orchid Phalaenopsis',
      slug: 'orchid-phalaenopsis',
      description:
        'An elegant Phalaenopsis orchid, known for its beautiful, long-lasting blooms, perfect for adding sophistication.',
      price: 45.0,
      stock: 18,
      images: [
        'https://images.unsplash.com/photo-1455582916367-25f75bfc6710?auto=format&fit=crop&w=1200&q=85',
      ],
      careInstructions:
        'Indirect light, water once a week, use orchid fertilizer.',
      occasion: 'Gift, Office Decor',
      categoryId: indoorPlants.id,
    },
  });

  await prisma.product.upsert({
    where: { name: 'Sunflower Sunshine Bouquet' },
    update: {
      images: [
        'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=85',
      ],
    },
    create: {
      name: 'Sunflower Sunshine Bouquet',
      slug: 'sunflower-sunshine-bouquet',
      description:
        'A cheerful bouquet of bright sunflowers, bringing warmth and joy to any occasion.',
      price: 40.0,
      stock: 35,
      images: [
        'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=85',
      ],
      careInstructions:
        'Keep in fresh water, trim stems, and provide bright light.',
      occasion: 'Summer, Get Well',
      categoryId: bouquets.id,
    },
  });

  console.log('Seeding finished successfully.');
  console.log('Admin:', {
    email: process.env.SEED_ADMIN_EMAIL ?? 'admin@bloomstore.local',
  });
  console.log('Customer:', {
    email: process.env.SEED_CUSTOMER_EMAIL ?? 'customer@bloomstore.local',
  });
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
