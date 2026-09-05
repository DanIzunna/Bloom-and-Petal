import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { PaymentsService } from './payments.service';

type AuthenticatedRequest = Request & {
  user: {
    sub: string;
    role: 'CUSTOMER' | 'ADMIN';
  };
};

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * NEW PAYMENTINTENT FLOW
   *
   * Creates a Stripe PaymentIntent and returns the client secret
   * used by the frontend Payment Element.
   */
  @Post('intent')
  @UseGuards(JwtAuthGuard)
  createPaymentIntent(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateCheckoutDto,
  ) {
    if (request.user.role === 'ADMIN') {
      throw new ForbiddenException('Admin users cannot make customer payments');
    }

    return this.paymentsService.createPaymentIntent(request.user.sub, dto);
  }

  /**
   * NEW PAYMENTINTENT STATUS
   *
   * The frontend uses this on the success page to check whether
   * the webhook has completed order creation.
   */
  @Get('status/:paymentId')
  @UseGuards(JwtAuthGuard)
  getPaymentStatus(
    @Req() request: AuthenticatedRequest,
    @Param('paymentId') paymentId: string,
  ) {
    if (request.user.role === 'ADMIN') {
      throw new ForbiddenException(
        'Admin accounts cannot access customer payments',
      );
    }

    return this.paymentsService.getPaymentStatus(request.user.sub, paymentId);
  }

  /**
   * OLD CHECKOUT SESSION FLOW
   *
   * Kept temporarily for backwards compatibility with existing
   * Checkout Session records.
   */
  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  createCheckout(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateCheckoutDto,
  ) {
    if (request.user.role === 'ADMIN') {
      throw new ForbiddenException('Admin users cannot make customer payments');
    }

    return this.paymentsService.createCheckoutSession(request.user.sub, dto);
  }

  /**
   * OLD CHECKOUT SESSION STATUS
   *
   * Kept temporarily for existing Checkout Session payments.
   */
  @Get('session/:sessionId')
  @UseGuards(JwtAuthGuard)
  getSession(
    @Req() request: AuthenticatedRequest,
    @Param('sessionId') sessionId: string,
  ) {
    if (request.user.role === 'ADMIN') {
      throw new ForbiddenException(
        'Admin accounts cannot access customer payments',
      );
    }

    return this.paymentsService.getSessionStatus(request.user.sub, sessionId);
  }

  /**
   * STRIPE WEBHOOK
   *
   * Must remain unauthenticated because Stripe calls this endpoint
   * directly. The Stripe signature is verified inside PaymentsService.
   */
  @Post('webhook')
  @SkipThrottle()
  async handleWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string | undefined,
  ) {
    return this.paymentsService.handleWebhook(request.rawBody, signature);
  }
}
