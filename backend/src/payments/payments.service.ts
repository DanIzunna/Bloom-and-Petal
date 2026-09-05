import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.config.getOrThrow<string>('STRIPE_SECRET_KEY'),
    );
  }

  /**
   * Create a Stripe PaymentIntent for the embedded Payment Element.
   *
   * Important:
   * - Prices are always read from the database.
   * - The client never determines the final amount.
   * - Stock is checked here and again when the payment succeeds.
   * - The order is NOT created here.
   */
  async createPaymentIntent(userId: string, dto: CreateCheckoutDto) {
    const deliveryDate = new Date(dto.deliveryDate);

    if (!Number.isFinite(deliveryDate.getTime())) {
      throw new BadRequestException('Invalid delivery date');
    }

    if (deliveryDate.getTime() < Date.now()) {
      throw new BadRequestException('Delivery date must not be in the past');
    }

    const productIds = dto.items.map((item) => item.productId);

    if (new Set(productIds).size !== productIds.length) {
      throw new BadRequestException('Each product may appear only once');
    }

    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
      },
    });

    const byId = new Map(products.map((product) => [product.id, product]));

    let totalAmount = new Prisma.Decimal(0);

    const paymentItems = dto.items.map((item) => {
      const product = byId.get(item.productId);

      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      if (item.quantity > product.stock) {
        throw new BadRequestException(`Insufficient stock for ${product.name}`);
      }

      totalAmount = totalAmount.add(product.price.mul(item.quantity));

      return {
        product,
        quantity: item.quantity,
        price: product.price,
      };
    });

    if (totalAmount.lessThanOrEqualTo(0)) {
      throw new BadRequestException('Checkout total must be greater than zero');
    }

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        status: PaymentStatus.PENDING,
        amount: totalAmount,
        currency: 'usd',
        recipientName: dto.recipientName.trim(),
        deliveryAddress: dto.deliveryAddress.trim(),
        deliveryDate,
        items: {
          create: paymentItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    });

    try {
      const intent = await this.stripe.paymentIntents.create({
        amount: totalAmount.mul(100).toDecimalPlaces(0).toNumber(),
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          paymentId: payment.id,
          userId,
        },
        description: `Bloom & Petal order ${payment.id
          .slice(0, 8)
          .toUpperCase()}`,
      });

      if (!intent.client_secret) {
        throw new Error('Stripe did not return a PaymentIntent client secret');
      }

      await this.prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          stripePaymentIntentId: intent.id,
        },
      });

      return {
        success: true,
        data: {
          paymentId: payment.id,
          clientSecret: intent.client_secret,
          amount: totalAmount.toFixed(2),
          currency: 'usd',
        },
      };
    } catch (error) {
      await this.prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: PaymentStatus.FAILED,
        },
      });

      throw error;
    }
  }

  /**
   * Get the application-level payment status.
   *
   * The frontend uses this instead of querying Stripe directly.
   * The webhook remains the source of truth for fulfillment.
   */
  async getPaymentStatus(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId,
      },
      select: {
        id: true,
        status: true,
        amount: true,
        currency: true,
        order: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return {
      success: true,
      data: {
        status: payment.status,
        orderId: payment.order?.id ?? null,
        amount: payment.amount.toFixed(2),
        currency: payment.currency,
      },
    };
  }

  /**
   * OLD STRIPE CHECKOUT FLOW
   *
   * Kept temporarily for backwards compatibility with existing
   * Checkout Session payment records and webhook events.
   */
  async createCheckoutSession(userId: string, dto: CreateCheckoutDto) {
    const deliveryDate = new Date(dto.deliveryDate);

    if (!Number.isFinite(deliveryDate.getTime())) {
      throw new BadRequestException('Invalid delivery date');
    }

    if (deliveryDate.getTime() < Date.now()) {
      throw new BadRequestException('Delivery date must not be in the past');
    }

    const productIds = dto.items.map((item) => item.productId);

    if (new Set(productIds).size !== productIds.length) {
      throw new BadRequestException('Each product may appear only once');
    }

    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        images: true,
      },
    });

    const byId = new Map(products.map((product) => [product.id, product]));

    let totalAmount = new Prisma.Decimal(0);

    const paymentItems = dto.items.map((item) => {
      const product = byId.get(item.productId);

      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      if (item.quantity > product.stock) {
        throw new BadRequestException(`Insufficient stock for ${product.name}`);
      }

      totalAmount = totalAmount.add(product.price.mul(item.quantity));

      return {
        product,
        quantity: item.quantity,
        price: product.price,
      };
    });

    if (totalAmount.lessThanOrEqualTo(0)) {
      throw new BadRequestException('Checkout total must be greater than zero');
    }

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        status: PaymentStatus.PENDING,
        amount: totalAmount,
        currency: 'usd',
        recipientName: dto.recipientName.trim(),
        deliveryAddress: dto.deliveryAddress.trim(),
        deliveryDate,
        stripeSessionId: `pending-${randomUUID()}`,
        items: {
          create: paymentItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    });

    try {
      const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');

      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',

        line_items: paymentItems.map((item) => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.product.name,
              ...(item.product.images[0]
                ? {
                    images: [item.product.images[0]],
                  }
                : {}),
            },
            unit_amount: item.price.mul(100).toDecimalPlaces(0).toNumber(),
          },
          quantity: item.quantity,
        })),

        metadata: {
          paymentId: payment.id,
          userId,
        },

        success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/cart?payment=cancelled`,
      });

      if (!session.url) {
        throw new Error('Stripe did not return a checkout URL');
      }

      await this.prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          stripeSessionId: session.id,
        },
      });

      return {
        success: true,
        data: {
          checkoutUrl: session.url,
          sessionId: session.id,
        },
      };
    } catch (error) {
      await this.prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: PaymentStatus.FAILED,
        },
      });

      throw error;
    }
  }

  /**
   * OLD CHECKOUT SESSION STATUS
   *
   * Kept temporarily for backwards compatibility.
   */
  async getSessionStatus(userId: string, sessionId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        userId,
        stripeSessionId: sessionId,
      },
      select: {
        id: true,
        status: true,
        amount: true,
        currency: true,
        order: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Checkout session not found');
    }

    return {
      success: true,
      data: {
        status: payment.status,
        orderId: payment.order?.id ?? null,
        amount: payment.amount.toFixed(2),
        currency: payment.currency,
      },
    };
  }

  /**
   * Stripe webhook handler.
   *
   * The webhook is the authoritative source for payment completion.
   */
  async handleWebhook(
    rawBody: Buffer | undefined,
    signature: string | undefined,
  ) {
    if (!rawBody) {
      throw new BadRequestException('Missing raw webhook body');
    }

    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    const webhookSecret = this.config.getOrThrow<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    this.logger.log(`Received Stripe event: ${event.type} (${event.id})`);

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          this.logger.log(
            `Fulfilling PaymentIntent: ${(event.data.object as Stripe.PaymentIntent).id}`,
          );

          await this.fulfillPaymentIntent(
            event.data.object as Stripe.PaymentIntent,
          );

          this.logger.log(
            `PaymentIntent fulfillment completed: ${(event.data.object as Stripe.PaymentIntent).id}`,
          );
          break;

        case 'payment_intent.payment_failed':
          await this.markPaymentIntentFailed(
            event.data.object as Stripe.PaymentIntent,
          );
          break;

        case 'payment_intent.canceled':
          await this.markPaymentIntentCanceled(
            event.data.object as Stripe.PaymentIntent,
          );
          break;

        case 'checkout.session.completed':
          await this.fulfillCheckout(
            event.data.object as Stripe.Checkout.Session,
          );
          break;

        case 'checkout.session.async_payment_succeeded':
          await this.fulfillCheckout(
            event.data.object as Stripe.Checkout.Session,
          );
          break;

        case 'checkout.session.async_payment_failed':
          await this.markPaymentFailed(
            event.data.object as Stripe.Checkout.Session,
          );
          break;

        default:
          break;
      }

      return {
        received: true,
      };
    } catch (error) {
      this.logger.error(
        `Stripe webhook processing failed for ${event.type} (${event.id})`,
        error instanceof Error ? error.stack : String(error),
      );

      throw error;
    }
  }

  /**
   * Fulfill a successful PaymentIntent.
   *
   * This is where:
   * 1. Stock is decremented.
   * 2. The Order is created.
   * 3. Payment is marked PAID.
   *
   * Everything happens transactionally.
   */
  private async fulfillPaymentIntent(intent: Stripe.PaymentIntent) {
    if (intent.status !== 'succeeded') {
      return;
    }

    const paymentId = intent.metadata?.paymentId;

    if (!paymentId) {
      throw new BadRequestException(
        'PaymentIntent is missing payment metadata',
      );
    }

    const payment = await this.prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
      include: {
        items: true,
        order: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    /*
     * Make sure the PaymentIntent belongs to the payment record
     * that created it.
     */
    if (
      payment.stripePaymentIntentId &&
      payment.stripePaymentIntentId !== intent.id
    ) {
      throw new BadRequestException(
        'PaymentIntent does not match payment record',
      );
    }

    /*
     * Stripe can send the same webhook more than once.
     * If the order already exists, fulfillment is complete.
     */
    if (payment.status === PaymentStatus.PAID && payment.order) {
      return;
    }

    await this.prisma.$transaction(
      async (transaction) => {
        const currentPayment = await transaction.payment.findUnique({
          where: {
            id: paymentId,
          },
          include: {
            items: true,
            order: true,
          },
        });

        if (!currentPayment) {
          throw new NotFoundException('Payment record not found');
        }

        if (
          currentPayment.status === PaymentStatus.PAID &&
          currentPayment.order
        ) {
          return;
        }

        /*
         * Make sure the PaymentIntent matches the stored one
         * before changing stock.
         */
        if (
          currentPayment.stripePaymentIntentId &&
          currentPayment.stripePaymentIntentId !== intent.id
        ) {
          throw new BadRequestException(
            'PaymentIntent does not match payment record',
          );
        }

        let totalAmount = new Prisma.Decimal(0);

        for (const item of currentPayment.items) {
          const updated = await transaction.product.updateMany({
            where: {
              id: item.productId,
              stock: {
                gte: item.quantity,
              },
            },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });

          if (updated.count !== 1) {
            throw new BadRequestException(
              `Insufficient stock for product ${item.productId}`,
            );
          }

          totalAmount = totalAmount.add(item.price.mul(item.quantity));
        }

        const order = await transaction.order.create({
          data: {
            userId: currentPayment.userId,
            paymentId: currentPayment.id,
            recipientName: currentPayment.recipientName,
            deliveryAddress: currentPayment.deliveryAddress,
            deliveryDate: currentPayment.deliveryDate,
            totalAmount,
            status: OrderStatus.PENDING,
            orderItems: {
              create: currentPayment.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
              })),
            },
          },
        });

        await transaction.payment.update({
          where: {
            id: currentPayment.id,
          },
          data: {
            status: PaymentStatus.PAID,
            stripePaymentIntentId: intent.id,
            paidAt: new Date(),
          },
        });

        return order;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 10_000,
      },
    );
  }

  /**
   * Mark a PaymentIntent payment as failed.
   */
  private async markPaymentIntentFailed(intent: Stripe.PaymentIntent) {
    const paymentId = intent.metadata?.paymentId;

    if (!paymentId) {
      return;
    }

    await this.prisma.payment.updateMany({
      where: {
        id: paymentId,
        stripePaymentIntentId: intent.id,
        status: PaymentStatus.PENDING,
      },
      data: {
        status: PaymentStatus.FAILED,
      },
    });
  }

  /**
   * Mark a canceled PaymentIntent as expired.
   */
  private async markPaymentIntentCanceled(intent: Stripe.PaymentIntent) {
    const paymentId = intent.metadata?.paymentId;

    if (!paymentId) {
      return;
    }

    await this.prisma.payment.updateMany({
      where: {
        id: paymentId,
        stripePaymentIntentId: intent.id,
        status: PaymentStatus.PENDING,
      },
      data: {
        status: PaymentStatus.EXPIRED,
      },
    });
  }

  /**
   * OLD CHECKOUT SESSION FULFILLMENT
   *
   * Kept for existing Checkout Session records.
   */
  private async fulfillCheckout(session: Stripe.Checkout.Session) {
    if (session.payment_status !== 'paid') {
      return;
    }

    const paymentId = session.metadata?.paymentId;

    if (!paymentId) {
      throw new BadRequestException(
        'Stripe session is missing payment metadata',
      );
    }

    const payment = await this.prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
      include: {
        items: true,
        order: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    /*
     * Stripe may deliver the same event more than once.
     */
    if (payment.status === PaymentStatus.PAID && payment.order) {
      return;
    }

    await this.prisma.$transaction(
      async (transaction) => {
        const currentPayment = await transaction.payment.findUnique({
          where: {
            id: paymentId,
          },
          include: {
            items: true,
            order: true,
          },
        });

        if (!currentPayment) {
          throw new NotFoundException('Payment record not found');
        }

        if (
          currentPayment.status === PaymentStatus.PAID &&
          currentPayment.order
        ) {
          return;
        }

        let totalAmount = new Prisma.Decimal(0);

        for (const item of currentPayment.items) {
          const updated = await transaction.product.updateMany({
            where: {
              id: item.productId,
              stock: {
                gte: item.quantity,
              },
            },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });

          if (updated.count !== 1) {
            throw new BadRequestException(
              `Insufficient stock for product ${item.productId}`,
            );
          }

          totalAmount = totalAmount.add(item.price.mul(item.quantity));
        }

        const order = await transaction.order.create({
          data: {
            userId: currentPayment.userId,
            paymentId: currentPayment.id,
            recipientName: currentPayment.recipientName,
            deliveryAddress: currentPayment.deliveryAddress,
            deliveryDate: currentPayment.deliveryDate,
            totalAmount,
            status: OrderStatus.PENDING,
            orderItems: {
              create: currentPayment.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
              })),
            },
          },
        });

        await transaction.payment.update({
          where: {
            id: currentPayment.id,
          },
          data: {
            status: PaymentStatus.PAID,
            stripeSessionId: session.id,
            stripePaymentIntentId:
              typeof session.payment_intent === 'string'
                ? session.payment_intent
                : null,
            paidAt: new Date(),
          },
        });

        return order;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 10_000,
      },
    );
  }

  /**
   * OLD CHECKOUT SESSION FAILURE HANDLER.
   */
  private async markPaymentFailed(session: Stripe.Checkout.Session) {
    const paymentId = session.metadata?.paymentId;

    if (!paymentId) {
      return;
    }

    await this.prisma.payment.updateMany({
      where: {
        id: paymentId,
        status: PaymentStatus.PENDING,
      },
      data: {
        status: PaymentStatus.FAILED,
      },
    });
  }
}
