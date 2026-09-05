import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

type AuthenticatedRequest = Request & { user: { sub: string } };

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@Req() request: AuthenticatedRequest) {
    return {
      success: true,
      data: await this.usersService.findSafeById(request.user.sub),
    };
  }
}
