import { Body, Controller, Get, Post } from '@nestjs/common';
import { AccessToken, Protected, UserId } from 'src/decorators/auth.decorators';

import { ChangePasswordInput } from './dto/change-password.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Protected()
  @Get('me')
  getMe(@UserId() userId: number) {
    return this.usersService.getMe(userId);
  }

  @Protected()
  @Post('change-password')
  changePassword(
    @Body() input: ChangePasswordInput,
    @AccessToken() accessToken: string,
  ) {
    return this.usersService.changePassword(accessToken, input);
  }
}
