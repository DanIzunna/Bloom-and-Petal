import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

const orderInclude = {
  orderItems: {
    select: {
      id: true,
      quantity: true,
      price: true,
      product: {
        select: {
          id: true,
          name: true,
          images: true,
          imageUrl: true,
        },
      },
    },
  },
} as const;

type AuthenticatedUser = {
  sub: string;
  role: 'CUSTOMER' | 'ADMIN';
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto) {
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

    const order = await this.prisma.$transaction(async (transaction) => {
      const products = await transaction.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
        select: {
          id: true,
          name: true,
          price: true,
        },
      });

      const byId = new Map(products.map((product) => [product.id, product]));

      let totalAmount = new Prisma.Decimal(0);

      const items = dto.items.map((item) => {
        const product = byId.get(item.productId);

        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }

        const lineTotal = product.price.mul(item.quantity);
        totalAmount = totalAmount.add(lineTotal);

        return {
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
        };
      });

      for (const item of items) {
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
          throw new BadRequestException('Insufficient stock; please retry');
        }
      }

      return transaction.order.create({
        data: {
          userId,
          recipientName: dto.recipientName.trim(),
          deliveryAddress: dto.deliveryAddress.trim(),
          deliveryDate,
          totalAmount,
          orderItems: {
            create: items,
          },
        },
        include: orderInclude,
      });
    });

    return {
      success: true,
      data: this.serializeOrder(order),
    };
  }

  async findForUser(user: AuthenticatedUser, query: OrderQueryDto) {
    const where: Prisma.OrderWhereInput = {
      ...(user.role === 'CUSTOMER' && {
        userId: user.sub,
      }),
      ...(query.status && {
        status: query.status,
      }),
    };

    return this.findMany(where, query);
  }

  async findForAdmin(query: OrderQueryDto) {
    return this.findMany(
      query.status
        ? {
            status: query.status,
          }
        : {},
      query,
    );
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        ...(user.role === 'CUSTOMER' && {
          userId: user.sub,
        }),
      },
      include: orderInclude,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      success: true,
      data: this.serializeOrder(order),
    };
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.$transaction(async (transaction) => {
      const current = await transaction.order.findUnique({
        where: { id },
        select: {
          status: true,
          orderItems: {
            select: {
              productId: true,
              quantity: true,
            },
          },
        },
      });

      if (!current) {
        throw new NotFoundException('Order not found');
      }

      if (!this.isAllowedTransition(current.status, dto.status)) {
        throw new BadRequestException(
          `Cannot change order status from ${current.status} to ${dto.status}`,
        );
      }

      const updated = await transaction.order.updateMany({
        where: {
          id,
          status: current.status,
        },
        data: {
          status: dto.status,
        },
      });

      if (updated.count !== 1) {
        throw new BadRequestException('Order status changed; please retry');
      }

      if (dto.status === OrderStatus.CANCELLED) {
        for (const item of current.orderItems) {
          await transaction.product.update({
            where: {
              id: item.productId,
            },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      return transaction.order.findUniqueOrThrow({
        where: {
          id,
        },
        include: orderInclude,
      });
    });

    return {
      success: true,
      data: this.serializeOrder(order),
    };
  }

  private async findMany(where: Prisma.OrderWhereInput, query: OrderQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;

    const orderBy = {
      [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc',
    } as Prisma.OrderOrderByWithRelationInput;

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: orderInclude,
      }),

      this.prisma.order.count({
        where,
      }),
    ]);

    return {
      success: true,
      data: {
        items: orders.map((order) => this.serializeOrder(order)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  private serializeOrder<
    T extends {
      totalAmount: Prisma.Decimal;
      orderItems: Array<{
        price: Prisma.Decimal;
        [key: string]: unknown;
      }>;
    },
  >(order: T) {
    return {
      ...order,
      totalAmount: order.totalAmount.toFixed(2),
      orderItems: order.orderItems.map((item) => ({
        ...item,
        price: item.price.toFixed(2),
      })),
    };
  }

  private isAllowedTransition(current: OrderStatus, next: OrderStatus) {
    if (current === next) {
      return true;
    }

    const transitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      PROCESSING: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      DELIVERED: [],
      CANCELLED: [],
    };

    return transitions[current].includes(next);
  }
}
