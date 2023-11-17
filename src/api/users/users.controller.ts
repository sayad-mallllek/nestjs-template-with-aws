import { Body, Controller, Get, Put } from '@nestjs/common';
import { AuthUser, Protected, UserId } from 'src/decorators/auth.decorators';

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
  @Put('change-password')
  changePassword(@Body() input: ChangePasswordInput, @AuthUser() user: string) {
    return this.usersService.changePassword(+user, input);
  }
}
