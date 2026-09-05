import { Module } from '@nestjs/common';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { AuthModule } from '../auth/auth.module';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [CloudinaryModule, AuthModule],
  controllers: [UploadsController],
})
export class UploadsModule {}
