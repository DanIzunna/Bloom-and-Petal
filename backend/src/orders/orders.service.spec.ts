import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;

  const prisma = {
    $transaction: jest.fn(),
    order: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrdersService(prisma as any);
  });

  describe('findOne', () => {
    it('returns an order belonging to the customer', async () => {
      const order = {
        id: 'order-1',
        userId: 'user-1',
        totalAmount: new Prisma.Decimal('150.00'),
        orderItems: [
          {
            id: 'item-1',
            quantity: 2,
            price: new Prisma.Decimal('75.00'),
            product: {
              id: 'product-1',
              name: 'Birthday Basket',
              images: [],
              imageUrl: null,
            },
          },
        ],
      };

      prisma.order.findFirst.mockResolvedValue(order);

      const result = await service.findOne('order-1', {
        sub: 'user-1',
        role: 'CUSTOMER',
      });

      expect(prisma.order.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'order-1',
            userId: 'user-1',
          },
        }),
      );

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('order-1');
      expect(result.data.totalAmount).toBe('150.00');
      expect(result.data.orderItems[0].price).toBe('75.00');
    });

    it('throws 404 when the order does not exist', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('missing-order', {
          sub: 'user-1',
          role: 'CUSTOMER',
        }),
      ).rejects.toThrow(new NotFoundException('Order not found'));
    });

    it('does not allow a customer to access another customer order', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('order-1', {
          sub: 'user-2',
          role: 'CUSTOMER',
        }),
      ).rejects.toThrow(new NotFoundException('Order not found'));

      expect(prisma.order.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'order-1',
            userId: 'user-2',
          },
        }),
      );
    });

    it('allows an admin to access any order', async () => {
      const order = {
        id: 'order-1',
        userId: 'user-1',
        totalAmount: new Prisma.Decimal('100.00'),
        orderItems: [],
      };

      prisma.order.findFirst.mockResolvedValue(order);

      const result = await service.findOne('order-1', {
        sub: 'admin-1',
        role: 'ADMIN',
      });

      expect(prisma.order.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'order-1',
          },
        }),
      );

      expect(result.success).toBe(true);
    });
  });

  describe('updateStatus', () => {
    function setupTransaction(currentOrder: any) {
      const transaction = {
        order: {
          findUnique: jest.fn().mockResolvedValue(currentOrder),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          findUniqueOrThrow: jest.fn().mockResolvedValue({
            id: currentOrder?.id ?? 'order-1',
            status: OrderStatus.PROCESSING,
            totalAmount: new Prisma.Decimal('100.00'),
            orderItems: [],
          }),
        },
        product: {
          update: jest.fn().mockResolvedValue({}),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(transaction);
      });

      return transaction;
    }

    it('allows PENDING → PROCESSING', async () => {
      setupTransaction({
        id: 'order-1',
        status: OrderStatus.PENDING,
        orderItems: [],
      });

      const result = await service.updateStatus('order-1', {
        status: OrderStatus.PROCESSING,
      });

      expect(result.success).toBe(true);
    });

    it('allows PROCESSING → DELIVERED', async () => {
      const transaction = setupTransaction({
        id: 'order-1',
        status: OrderStatus.PROCESSING,
        orderItems: [],
      });

      transaction.order.findUniqueOrThrow.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.DELIVERED,
        totalAmount: new Prisma.Decimal('100.00'),
        orderItems: [],
      });

      const result = await service.updateStatus('order-1', {
        status: OrderStatus.DELIVERED,
      });

      expect(result.data.status).toBe(OrderStatus.DELIVERED);
    });

    it('allows PENDING → CANCELLED', async () => {
      const transaction = setupTransaction({
        id: 'order-1',
        status: OrderStatus.PENDING,
        orderItems: [],
      });

      transaction.order.findUniqueOrThrow.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.CANCELLED,
        totalAmount: new Prisma.Decimal('100.00'),
        orderItems: [],
      });

      const result = await service.updateStatus('order-1', {
        status: OrderStatus.CANCELLED,
      });

      expect(result.data.status).toBe(OrderStatus.CANCELLED);
    });

    it('allows PROCESSING → CANCELLED', async () => {
      const transaction = setupTransaction({
        id: 'order-1',
        status: OrderStatus.PROCESSING,
        orderItems: [],
      });

      transaction.order.findUniqueOrThrow.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.CANCELLED,
        totalAmount: new Prisma.Decimal('100.00'),
        orderItems: [],
      });

      const result = await service.updateStatus('order-1', {
        status: OrderStatus.CANCELLED,
      });

      expect(result.data.status).toBe(OrderStatus.CANCELLED);
    });

    it('rejects DELIVERED → PROCESSING', async () => {
      setupTransaction({
        id: 'order-1',
        status: OrderStatus.DELIVERED,
        orderItems: [],
      });

      await expect(
        service.updateStatus('order-1', {
          status: OrderStatus.PROCESSING,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects CANCELLED → PROCESSING', async () => {
      setupTransaction({
        id: 'order-1',
        status: OrderStatus.CANCELLED,
        orderItems: [],
      });

      await expect(
        service.updateStatus('order-1', {
          status: OrderStatus.PROCESSING,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws 404 when updating a nonexistent order', async () => {
      setupTransaction(null);

      await expect(
        service.updateStatus('missing-order', {
          status: OrderStatus.PROCESSING,
        }),
      ).rejects.toThrow(new NotFoundException('Order not found'));
    });

    it('restores stock when an order is cancelled', async () => {
      const transaction = setupTransaction({
        id: 'order-1',
        status: OrderStatus.PROCESSING,
        orderItems: [
          {
            productId: 'product-1',
            quantity: 2,
          },
          {
            productId: 'product-2',
            quantity: 3,
          },
        ],
      });

      transaction.order.findUniqueOrThrow.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.CANCELLED,
        totalAmount: new Prisma.Decimal('100.00'),
        orderItems: [],
      });

      await service.updateStatus('order-1', {
        status: OrderStatus.CANCELLED,
      });

      expect(transaction.product.update).toHaveBeenCalledTimes(2);

      expect(transaction.product.update).toHaveBeenNthCalledWith(1, {
        where: {
          id: 'product-1',
        },
        data: {
          stock: {
            increment: 2,
          },
        },
      });

      expect(transaction.product.update).toHaveBeenNthCalledWith(2, {
        where: {
          id: 'product-2',
        },
        data: {
          stock: {
            increment: 3,
          },
        },
      });
    });
  });

  describe('create', () => {
    function setupCreateTransaction(products: any[]) {
      const transaction = {
        product: {
          findMany: jest.fn().mockResolvedValue(products),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        order: {
          create: jest.fn().mockResolvedValue({
            id: 'order-1',
            totalAmount: new Prisma.Decimal('200.00'),
            orderItems: [],
          }),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(transaction);
      });

      return transaction;
    }

    it('rejects an invalid delivery date', async () => {
      await expect(
        service.create('user-1', {
          recipientName: 'John',
          deliveryAddress: '123 Street',
          deliveryDate: 'not-a-date',
          items: [
            {
              productId: 'product-1',
              quantity: 1,
            },
          ],
        } as any),
      ).rejects.toThrow(new BadRequestException('Invalid delivery date'));
    });

    it('rejects duplicate products', async () => {
      await expect(
        service.create('user-1', {
          recipientName: 'John',
          deliveryAddress: '123 Street',
          deliveryDate: '2099-01-01',
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
        } as any),
      ).rejects.toThrow(
        new BadRequestException('Each product may appear only once'),
      );
    });

    it('rejects a product that does not exist', async () => {
      setupCreateTransaction([]);

      await expect(
        service.create('user-1', {
          recipientName: 'John',
          deliveryAddress: '123 Street',
          deliveryDate: '2099-01-01',
          items: [
            {
              productId: 'missing-product',
              quantity: 1,
            },
          ],
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates an order and decrements stock', async () => {
      const transaction = setupCreateTransaction([
        {
          id: 'product-1',
          name: 'Birthday Basket',
          price: new Prisma.Decimal('100.00'),
        },
        {
          id: 'product-2',
          name: 'Rose Bouquet',
          price: new Prisma.Decimal('50.00'),
        },
      ]);

      const result = await service.create('user-1', {
        recipientName: ' John Doe ',
        deliveryAddress: ' 123 Flower Street ',
        deliveryDate: '2099-01-01',
        items: [
          {
            productId: 'product-1',
            quantity: 2,
          },
          {
            productId: 'product-2',
            quantity: 1,
          },
        ],
      } as any);

      expect(transaction.product.updateMany).toHaveBeenCalledTimes(2);

      expect(transaction.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            recipientName: 'John Doe',
            deliveryAddress: '123 Flower Street',
            totalAmount: new Prisma.Decimal('250.00'),
          }),
        }),
      );

      expect(result.success).toBe(true);
    });

    it('rejects insufficient stock', async () => {
      const transaction = setupCreateTransaction([
        {
          id: 'product-1',
          name: 'Birthday Basket',
          price: new Prisma.Decimal('100.00'),
        },
      ]);

      transaction.product.updateMany.mockResolvedValue({
        count: 0,
      });

      await expect(
        service.create('user-1', {
          recipientName: 'John',
          deliveryAddress: '123 Street',
          deliveryDate: '2099-01-01',
          items: [
            {
              productId: 'product-1',
              quantity: 10,
            },
          ],
        } as any),
      ).rejects.toThrow(
        new BadRequestException('Insufficient stock; please retry'),
      );

      expect(transaction.order.create).not.toHaveBeenCalled();
    });
  });
});
