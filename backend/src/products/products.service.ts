import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateProductDto, UpdateProductDto, FilterProductDto } from './dto';

const productSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  price: true,
  stock: true,
  images: true,
  imageUrl: true,
  imagePublicId: true,
  careInstructions: true,
  occasion: true,
  category: { select: { id: true, name: true, slug: true } },
} as const;

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async findAll(filterDto: FilterProductDto) {
    const page = filterDto.page ?? 1;
    const limit = filterDto.limit ?? 12;
    const category = filterDto.category?.trim().toLowerCase();
    const search = filterDto.search?.trim();
    const where: Prisma.ProductWhereInput = {
      ...(category && { category: { slug: category } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    const orderBy = {
      [filterDto.sortBy ?? 'name']: filterDto.sortOrder ?? 'asc',
    } as Prisma.ProductOrderByWithRelationInput;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        select: productSelect,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);
    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(identifier: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        identifier,
      );
    const product = await this.prisma.product.findUnique({
      where: isUuid ? { id: identifier } : { slug: identifier },
      select: productSelect,
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(createProductDto: CreateProductDto) {
    const { categoryId, ...data } = createProductDto;
    const slug = await this.uniqueSlug(data.name);
    return this.prisma.product.create({
      data: {
        ...data,
        slug,
        category: {
          connect: { id: categoryId },
        },
      },
      select: productSelect,
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { categoryId, imageUrl, imagePublicId, ...data } = updateProductDto;
    const current = await this.prisma.product.findUnique({
      where: { id },
      select: {
        name: true,
        slug: true,
        imagePublicId: true,
      },
    });
    if (!current) throw new NotFoundException('Product not found');
    const slug =
      data.name && data.name !== current.name
        ? await this.uniqueSlug(data.name, id)
        : current.slug;

    // If new image is provided, update product first then clean up old image
    const updateData = {
      ...data,
      slug,
      ...(categoryId && { category: { connect: { id: categoryId } } }),
      ...(imageUrl && { imageUrl }),
      ...(imagePublicId && { imagePublicId }),
    };

    const updated = await this.prisma.product.update({
      where: { id },
      data: updateData,
      select: productSelect,
    });

    // Delete old image only after successful database update
    if (imagePublicId && current.imagePublicId) {
      await this.cloudinaryService.deleteImage(current.imagePublicId);
    }

    return updated;
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { ...productSelect, imagePublicId: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    // Delete the product first
    const deleted = await this.prisma.product.delete({
      where: { id },
      select: productSelect,
    });

    // Delete image only after successful database deletion
    if (product.imagePublicId) {
      await this.cloudinaryService.deleteImage(product.imagePublicId);
    }

    return deleted;
  }

  private async uniqueSlug(name: string, excludeId?: string) {
    const base =
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'product';
    let slug = base;
    let suffix = 2;
    while (
      await this.prisma.product.findFirst({
        where: { slug, ...(excludeId && { id: { not: excludeId } }) },
        select: { id: true },
      })
    ) {
      slug = `${base}-${suffix++}`;
    }
    return slug;
  }
}
