import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      exception.code === 'P2025'
        ? HttpStatus.NOT_FOUND
        : exception.code === 'P2002'
          ? HttpStatus.CONFLICT
          : exception.code === 'P2003'
            ? HttpStatus.BAD_REQUEST
            : HttpStatus.BAD_REQUEST;
    const message =
      exception.code === 'P2025'
        ? 'The requested record was not found'
        : exception.code === 'P2002'
          ? 'A record with these values already exists'
          : exception.code === 'P2003'
            ? 'The referenced record does not exist'
            : 'The request could not be completed';
    response.status(status).json({ statusCode: status, message });
  }
}
