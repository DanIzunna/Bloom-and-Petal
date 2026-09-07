import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma, PaymentStatus, OrderStatus } from '@prisma/client';
import { PaymentsService } from './payments.service';

const mockStripe = {
  paymentIntents: {
    create: jest.fn(),
  },
  checkout: {
    sessions: {
      create: jest.fn(),
    },
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => mockStripe);
});

jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('PaymentsService', () => {
  let service: PaymentsService;

  let prisma: {
    product: {
      findMany: jest.Mock;
    };
    payment: {
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  let config: {
    getOrThrow: jest.Mock;
  };

  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const validDto = {
    recipientName: 'John Doe',
    deliveryAddress: '123 Test Street',
    deliveryDate: futureDate.toISOString(),
    items: [
      {
        productId: 'product-1',
        quantity: 2,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    prisma = {
      product: {
        findMany: jest.fn(),
      },
      payment: {
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    config = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'STRIPE_SECRET_KEY') {
          return 'stripe-test-key';
        }

        if (key === 'STRIPE_WEBHOOK_SECRET') {
          return 'webhook-secret';
        }

        if (key === 'FRONTEND_URL') {
          return 'http://localhost:3000';
        }

        return 'test-value';
      }),
    };

    service = new PaymentsService(prisma as any, config as any);
  });

  describe('createPaymentIntent', () => {
    it('creates a payment and Stripe PaymentIntent successfully', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'product-1',
          name: 'Birthday Basket',
          price: new Prisma.Decimal('100.00'),
          stock: 10,
        },
      ]);

      prisma.payment.create.mockResolvedValue({
        id: 'payment-1',
      });

      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'secret_123',
        status: 'requires_payment_method',
      });

      prisma.payment.update.mockResolvedValue({});

      const result = await service.createPaymentIntent(
        'user-1',
        validDto as any,
      );

      expect(result).toEqual({
        success: true,
        data: {
          paymentId: 'payment-1',
          clientSecret: 'secret_123',
          amount: '200.00',
          currency: 'usd',
        },
      });

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['product-1'],
          },
        },
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
        },
      });

      expect(prisma.payment.create).toHaveBeenCalled();

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 20000,
          currency: 'usd',
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            paymentId: 'payment-1',
            userId: 'user-1',
          },
          description: 'Bloom & Petal order PAYMENT-',
        }),
      );

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: {
          id: 'payment-1',
        },
        data: {
          stripePaymentIntentId: 'pi_test_123',
        },
      });
    });

    it('rejects an invalid delivery date', async () => {
      const dto = {
        ...validDto,
        deliveryDate: 'not-a-date',
      };

      await expect(
        service.createPaymentIntent('user-1', dto as any),
      ).rejects.toThrow(new BadRequestException('Invalid delivery date'));

      expect(prisma.product.findMany).not.toHaveBeenCalled();
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('rejects a delivery date in the past', async () => {
      const dto = {
        ...validDto,
        deliveryDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      };

      await expect(
        service.createPaymentIntent('user-1', dto as any),
      ).rejects.toThrow(
        new BadRequestException('Delivery date must not be in the past'),
      );

      expect(prisma.product.findMany).not.toHaveBeenCalled();
    });

    it('rejects duplicate products', async () => {
      const dto = {
        ...validDto,
        items: [
          {
            productId: 'product-1',
            quantity: 1,
          },
          {
            productId: 'product-1',
            quantity: 2,
          },
        ],
      };

      await expect(
        service.createPaymentIntent('user-1', dto as any),
      ).rejects.toThrow(
        new BadRequestException('Each product may appear only once'),
      );

      expect(prisma.product.findMany).not.toHaveBeenCalled();
    });

    it('rejects a product that does not exist', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await expect(
        service.createPaymentIntent('user-1', validDto as any),
      ).rejects.toThrow(new NotFoundException('Product product-1 not found'));

      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('rejects an order when there is insufficient stock', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'product-1',
          name: 'Birthday Basket',
          price: new Prisma.Decimal('100.00'),
          stock: 1,
        },
      ]);

      await expect(
        service.createPaymentIntent('user-1', validDto as any),
      ).rejects.toThrow(
        new BadRequestException('Insufficient stock for Birthday Basket'),
      );

      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('rejects a checkout with a zero quantity', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'product-1',
          name: 'Birthday Basket',
          price: new Prisma.Decimal('100.00'),
          stock: 10,
        },
      ]);

      const dto = {
        ...validDto,
        items: [
          {
            productId: 'product-1',
            quantity: 0,
          },
        ],
      };

      await expect(
        service.createPaymentIntent('user-1', dto as any),
      ).rejects.toThrow(
        new BadRequestException('Checkout total must be greater than zero'),
      );

      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('marks the payment as failed when Stripe creation fails', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'product-1',
          name: 'Birthday Basket',
          price: new Prisma.Decimal('100.00'),
          stock: 10,
        },
      ]);

      prisma.payment.create.mockResolvedValue({
        id: 'payment-1',
      });

      mockStripe.paymentIntents.create.mockRejectedValue(
        new Error('Stripe unavailable'),
      );

      prisma.payment.update.mockResolvedValue({});

      await expect(
        service.createPaymentIntent('user-1', validDto as any),
      ).rejects.toThrow('Stripe unavailable');

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: {
          id: 'payment-1',
        },
        data: {
          status: PaymentStatus.FAILED,
        },
      });
    });

    it('fails if Stripe does not return a client secret', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'product-1',
          name: 'Birthday Basket',
          price: new Prisma.Decimal('100.00'),
          stock: 10,
        },
      ]);

      prisma.payment.create.mockResolvedValue({
        id: 'payment-1',
      });

      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test_123',
        client_secret: null,
      });

      prisma.payment.update.mockResolvedValue({});

      await expect(
        service.createPaymentIntent('user-1', validDto as any),
      ).rejects.toThrow('Stripe did not return a PaymentIntent client secret');

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: {
          id: 'payment-1',
        },
        data: {
          status: PaymentStatus.FAILED,
        },
      });
    });
  });

  describe('getPaymentStatus', () => {
    it('returns the payment status for the owning user', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        id: 'payment-1',
        status: PaymentStatus.PAID,
        amount: new Prisma.Decimal('250.00'),
        currency: 'usd',
        order: {
          id: 'order-1',
        },
      });

      const result = await service.getPaymentStatus('user-1', 'payment-1');

      expect(result).toEqual({
        success: true,
        data: {
          status: PaymentStatus.PAID,
          orderId: 'order-1',
          amount: '250.00',
          currency: 'usd',
        },
      });

      expect(prisma.payment.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'payment-1',
          userId: 'user-1',
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
    });

    it('returns null orderId when payment has no order', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        id: 'payment-1',
        status: PaymentStatus.PENDING,
        amount: new Prisma.Decimal('100.00'),
        currency: 'usd',
        order: null,
      });

      const result = await service.getPaymentStatus('user-1', 'payment-1');

      expect(result).toEqual({
        success: true,
        data: {
          status: PaymentStatus.PENDING,
          orderId: null,
          amount: '100.00',
          currency: 'usd',
        },
      });
    });

    it('throws when the payment does not exist or does not belong to the user', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(
        service.getPaymentStatus('user-1', 'payment-unknown'),
      ).rejects.toThrow(new NotFoundException('Payment not found'));
    });
  });

  describe('handleWebhook', () => {
    it('rejects a missing raw webhook body', async () => {
      await expect(
        service.handleWebhook(undefined, 'signature'),
      ).rejects.toThrow(new BadRequestException('Missing raw webhook body'));
    });

    it('rejects a missing Stripe signature', async () => {
      await expect(
        service.handleWebhook(Buffer.from('{}'), undefined),
      ).rejects.toThrow(new BadRequestException('Missing Stripe signature'));
    });

    it('rejects an invalid Stripe webhook signature', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        service.handleWebhook(Buffer.from('{}'), 'bad-signature'),
      ).rejects.toThrow(
        new BadRequestException('Invalid Stripe webhook signature'),
      );
    });

    it('ignores unknown webhook event types', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_unknown',
        type: 'some.unknown.event',
        data: {
          object: {},
        },
      });

      const result = await service.handleWebhook(
        Buffer.from('{}'),
        'signature',
      );

      expect(result).toEqual({
        received: true,
      });

      expect(prisma.payment.findUnique).not.toHaveBeenCalled();
    });

    it('marks a PaymentIntent as failed', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_failed',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_failed',
            metadata: {
              paymentId: 'payment-1',
            },
          },
        },
      });

      prisma.payment.updateMany.mockResolvedValue({
        count: 1,
      });

      const result = await service.handleWebhook(
        Buffer.from('{}'),
        'signature',
      );

      expect(result).toEqual({
        received: true,
      });

      expect(prisma.payment.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'payment-1',
          stripePaymentIntentId: 'pi_failed',
          status: PaymentStatus.PENDING,
        },
        data: {
          status: PaymentStatus.FAILED,
        },
      });
    });

    it('marks a canceled PaymentIntent as expired', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_cancelled',
        type: 'payment_intent.canceled',
        data: {
          object: {
            id: 'pi_cancelled',
            metadata: {
              paymentId: 'payment-1',
            },
          },
        },
      });

      prisma.payment.updateMany.mockResolvedValue({
        count: 1,
      });

      const result = await service.handleWebhook(
        Buffer.from('{}'),
        'signature',
      );

      expect(result).toEqual({
        received: true,
      });

      expect(prisma.payment.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'payment-1',
          stripePaymentIntentId: 'pi_cancelled',
          status: PaymentStatus.PENDING,
        },
        data: {
          status: PaymentStatus.EXPIRED,
        },
      });
    });

    it('does nothing for a failed PaymentIntent without payment metadata', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_failed',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_failed',
            metadata: {},
          },
        },
      });

      const result = await service.handleWebhook(
        Buffer.from('{}'),
        'signature',
      );

      expect(result).toEqual({
        received: true,
      });

      expect(prisma.payment.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('successful PaymentIntent fulfillment', () => {
    const successfulIntent = {
      id: 'pi_success',
      status: 'succeeded',
      metadata: {
        paymentId: 'payment-1',
      },
    };

    const paymentRecord = {
      id: 'payment-1',
      userId: 'user-1',
      status: PaymentStatus.PENDING,
      amount: new Prisma.Decimal('200.00'),
      currency: 'usd',
      recipientName: 'John Doe',
      deliveryAddress: '123 Test Street',
      deliveryDate: futureDate,
      stripePaymentIntentId: 'pi_success',
      paidAt: null,
      items: [
        {
          id: 'payment-item-1',
          productId: 'product-1',
          quantity: 2,
          price: new Prisma.Decimal('100.00'),
        },
      ],
      order: null,
    };

    it('creates an order, decrements stock, and marks payment as paid', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_success',
        type: 'payment_intent.succeeded',
        data: {
          object: successfulIntent,
        },
      });

      prisma.payment.findUnique.mockResolvedValue(paymentRecord);

      const transaction = {
        payment: {
          findUnique: jest.fn().mockResolvedValue(paymentRecord),
          update: jest.fn().mockResolvedValue({}),
        },
        product: {
          updateMany: jest.fn().mockResolvedValue({
            count: 1,
          }),
        },
        order: {
          create: jest.fn().mockResolvedValue({
            id: 'order-1',
          }),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) =>
        callback(transaction),
      );

      const result = await service.handleWebhook(
        Buffer.from('{}'),
        'signature',
      );

      expect(result).toEqual({
        received: true,
      });

      expect(transaction.product.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'product-1',
          stock: {
            gte: 2,
          },
        },
        data: {
          stock: {
            decrement: 2,
          },
        },
      });

      expect(transaction.order.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          paymentId: 'payment-1',
          recipientName: 'John Doe',
          deliveryAddress: '123 Test Street',
          deliveryDate: futureDate,
          totalAmount: new Prisma.Decimal('200.00'),
          status: OrderStatus.PENDING,
          orderItems: {
            create: [
              {
                productId: 'product-1',
                quantity: 2,
                price: new Prisma.Decimal('100.00'),
              },
            ],
          },
        },
      });

      expect(transaction.payment.update).toHaveBeenCalledWith({
        where: {
          id: 'payment-1',
        },
        data: {
          status: PaymentStatus.PAID,
          stripePaymentIntentId: 'pi_success',
          paidAt: expect.any(Date),
        },
      });

      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 10_000,
      });
    });

    it('does not fulfill a PaymentIntent that has not succeeded', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_processing',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            ...successfulIntent,
            status: 'processing',
          },
        },
      });

      const result = await service.handleWebhook(
        Buffer.from('{}'),
        'signature',
      );

      expect(result).toEqual({
        received: true,
      });

      expect(prisma.payment.findUnique).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects a successful PaymentIntent without payment metadata', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_success',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_success',
            status: 'succeeded',
            metadata: {},
          },
        },
      });

      await expect(
        service.handleWebhook(Buffer.from('{}'), 'signature'),
      ).rejects.toThrow(
        new BadRequestException('PaymentIntent is missing payment metadata'),
      );
    });

    it('rejects a successful PaymentIntent when the payment record does not exist', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_success',
        type: 'payment_intent.succeeded',
        data: {
          object: successfulIntent,
        },
      });

      prisma.payment.findUnique.mockResolvedValue(null);

      await expect(
        service.handleWebhook(Buffer.from('{}'), 'signature'),
      ).rejects.toThrow(new NotFoundException('Payment record not found'));

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects a PaymentIntent that does not match the stored payment', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_success',
        type: 'payment_intent.succeeded',
        data: {
          object: successfulIntent,
        },
      });

      prisma.payment.findUnique.mockResolvedValue({
        ...paymentRecord,
        stripePaymentIntentId: 'pi_different',
      });

      await expect(
        service.handleWebhook(Buffer.from('{}'), 'signature'),
      ).rejects.toThrow(
        new BadRequestException('PaymentIntent does not match payment record'),
      );

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('does not fulfill a payment that was already paid and has an order', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_duplicate',
        type: 'payment_intent.succeeded',
        data: {
          object: successfulIntent,
        },
      });

      prisma.payment.findUnique.mockResolvedValue({
        ...paymentRecord,
        status: PaymentStatus.PAID,
        order: {
          id: 'order-existing',
        },
      });

      const result = await service.handleWebhook(
        Buffer.from('{}'),
        'signature',
      );

      expect(result).toEqual({
        received: true,
      });

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('fails fulfillment when stock is no longer available', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_stock',
        type: 'payment_intent.succeeded',
        data: {
          object: successfulIntent,
        },
      });

      prisma.payment.findUnique.mockResolvedValue(paymentRecord);

      const transaction = {
        payment: {
          findUnique: jest.fn().mockResolvedValue(paymentRecord),
          update: jest.fn(),
        },
        product: {
          updateMany: jest.fn().mockResolvedValue({
            count: 0,
          }),
        },
        order: {
          create: jest.fn(),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) =>
        callback(transaction),
      );

      await expect(
        service.handleWebhook(Buffer.from('{}'), 'signature'),
      ).rejects.toThrow(
        new BadRequestException('Insufficient stock for product product-1'),
      );

      expect(transaction.order.create).not.toHaveBeenCalled();
      expect(transaction.payment.update).not.toHaveBeenCalled();
    });

    it('does not create a duplicate order when the transaction sees an already-paid payment', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_duplicate',
        type: 'payment_intent.succeeded',
        data: {
          object: successfulIntent,
        },
      });

      prisma.payment.findUnique.mockResolvedValue(paymentRecord);

      const transaction = {
        payment: {
          findUnique: jest.fn().mockResolvedValue({
            ...paymentRecord,
            status: PaymentStatus.PAID,
            order: {
              id: 'existing-order',
            },
          }),
          update: jest.fn(),
        },
        product: {
          updateMany: jest.fn(),
        },
        order: {
          create: jest.fn(),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) =>
        callback(transaction),
      );

      const result = await service.handleWebhook(
        Buffer.from('{}'),
        'signature',
      );

      expect(result).toEqual({
        received: true,
      });

      expect(transaction.product.updateMany).not.toHaveBeenCalled();
      expect(transaction.order.create).not.toHaveBeenCalled();
      expect(transaction.payment.update).not.toHaveBeenCalled();
    });
  });

  describe('legacy Checkout Session webhook', () => {
    it('fulfills a paid Checkout Session', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_checkout',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test',
            payment_status: 'paid',
            payment_intent: 'pi_checkout',
            metadata: {
              paymentId: 'payment-1',
            },
          },
        },
      });

      const paymentRecord = {
        id: 'payment-1',
        userId: 'user-1',
        status: PaymentStatus.PENDING,
        recipientName: 'John Doe',
        deliveryAddress: '123 Test Street',
        deliveryDate: futureDate,
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            quantity: 1,
            price: new Prisma.Decimal('150.00'),
          },
        ],
        order: null,
      };

      prisma.payment.findUnique.mockResolvedValue(paymentRecord);

      const transaction = {
        payment: {
          findUnique: jest.fn().mockResolvedValue(paymentRecord),
          update: jest.fn().mockResolvedValue({}),
        },
        product: {
          updateMany: jest.fn().mockResolvedValue({
            count: 1,
          }),
        },
        order: {
          create: jest.fn().mockResolvedValue({
            id: 'order-1',
          }),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) =>
        callback(transaction),
      );

      const result = await service.handleWebhook(
        Buffer.from('{}'),
        'signature',
      );

      expect(result).toEqual({
        received: true,
      });

      expect(transaction.product.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'product-1',
          stock: {
            gte: 1,
          },
        },
        data: {
          stock: {
            decrement: 1,
          },
        },
      });

      expect(transaction.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            paymentId: 'payment-1',
            totalAmount: new Prisma.Decimal('150.00'),
            status: OrderStatus.PENDING,
          }),
        }),
      );

      expect(transaction.payment.update).toHaveBeenCalledWith({
        where: {
          id: 'payment-1',
        },
        data: {
          status: PaymentStatus.PAID,
          stripeSessionId: 'cs_test',
          stripePaymentIntentId: 'pi_checkout',
          paidAt: expect.any(Date),
        },
      });
    });

    it('ignores a Checkout Session that was not paid', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_unpaid',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_unpaid',
            payment_status: 'unpaid',
            metadata: {
              paymentId: 'payment-1',
            },
          },
        },
      });

      const result = await service.handleWebhook(
        Buffer.from('{}'),
        'signature',
      );

      expect(result).toEqual({
        received: true,
      });

      expect(prisma.payment.findUnique).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('marks a legacy Checkout Session payment as failed', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_checkout_failed',
        type: 'checkout.session.async_payment_failed',
        data: {
          object: {
            id: 'cs_failed',
            metadata: {
              paymentId: 'payment-1',
            },
          },
        },
      });

      prisma.payment.updateMany.mockResolvedValue({
        count: 1,
      });

      const result = await service.handleWebhook(
        Buffer.from('{}'),
        'signature',
      );

      expect(result).toEqual({
        received: true,
      });

      expect(prisma.payment.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'payment-1',
          status: PaymentStatus.PENDING,
        },
        data: {
          status: PaymentStatus.FAILED,
        },
      });
    });
  });
});
