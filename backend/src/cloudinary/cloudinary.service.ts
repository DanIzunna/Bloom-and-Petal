import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export interface UploadResult {
  url: string;
  publicId: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {
    this.validateConfig();
    this.initializeCloudinary();
  }

  private validateConfig(): void {
    const required = [
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
    ];
    const missing = required.filter((key) => !this.configService.get(key));
    if (missing.length > 0) {
      throw new Error(
        `Missing required Cloudinary configuration: ${missing.join(', ')}`,
      );
    }
  }

  private initializeCloudinary(): void {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadProductImage(file: {
    buffer: Buffer;
    mimetype: string;
    size: number;
  }): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, and WebP are supported.',
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File too large. Maximum size is ${maxSize / 1024 / 1024}MB.`,
      );
    }

    try {
      const result = await new Promise<{
        secure_url: string;
        public_id: string;
      }>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'bloom-and-petal/products',
            resource_type: 'auto',
            overwrite: false,
          },
          (error, result) => {
            if (error) {
              reject(new Error('Cloudinary upload failed'));
            } else {
              resolve(result as { secure_url: string; public_id: string });
            }
          },
        );
        uploadStream.end(file.buffer);
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      this.logger.error('Cloudinary upload failed', error);
      throw new InternalServerErrorException('Image upload failed');
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    if (!publicId) {
      return; // No-op if no public ID
    }

    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      this.logger.error(
        `Failed to delete Cloudinary asset: ${publicId}`,
        error,
      );
      // Don't throw - log and continue to avoid cascading failures
    }
  }
}
