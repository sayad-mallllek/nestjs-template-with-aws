import { Body, Controller, Get, Patch, Put } from '@nestjs/common';
import { AuthUser, Protected, UserId } from 'src/decorators/auth.decorators';

import { UsersService } from './users.service';
import { ChangePasswordInput, UpdateUserInput } from './dto/inputs.dto';
import { ApiResponse } from '@nestjs/swagger';
import { UserDTO } from './dto/responses.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiResponse({ status: 200, type: UserDTO })
  @Protected()
  @Get('me')
  getMe(@UserId() userId: number) {
    return this.usersService.getMe(userId);
  }

  @Patch('me')
  updateMe(@Body() input: UpdateUserInput, @AuthUser() user: string) {
    return this.usersService.updateMe(input, +user);
  }

  @Protected()
  @Put('change-password')
  changePassword(@Body() input: ChangePasswordInput, @AuthUser() user: string) {
    return this.usersService.changePassword(+user, input);
  }
}
