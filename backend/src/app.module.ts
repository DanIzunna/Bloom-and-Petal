import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { OrdersModule } from './orders/orders.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { UploadsModule } from './uploads/uploads.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config: Record<string, string>) => {
        const required = [
          'DATABASE_URL',
          'JWT_SECRET',
          'FRONTEND_URL',
          'STRIPE_SECRET_KEY',
          'STRIPE_WEBHOOK_SECRET',
        ];

        const missing = required.filter((key) => !config[key]?.trim());

        if (missing.length > 0) {
          throw new Error(
            `Missing required environment variables: ${missing.join(', ')}`,
          );
        }

        try {
          new URL(config.DATABASE_URL);
          new URL(config.FRONTEND_URL);
        } catch {
          throw new Error('DATABASE_URL and FRONTEND_URL must be valid URLs');
        }

        if (config.JWT_SECRET.length < 32) {
          throw new Error('JWT_SECRET must be at least 32 characters long');
        }

        return config;
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    CloudinaryModule,
    UploadsModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
