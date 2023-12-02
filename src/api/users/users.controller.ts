import { Body, Controller, Get, Patch, Put } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { AuthUser, Protected, UserId } from 'src/decorators/auth.decorators';

import { ChangePasswordInput, UpdateUserInput } from './dto/inputs.dto';
import { UserDTO } from './dto/responses.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiResponse({ status: 200, type: UserDTO })
  @Protected()
  @Get('me')
  getMe(@UserId() userId: number) {
    return this.usersService.getMe(userId);
  }

  @ApiResponse({ status: 200, type: UserDTO })
  @Patch('me')
  updateMe(@Body() input: UpdateUserInput, @AuthUser() user: number) {
    return this.usersService.updateMe(input, user);
  }

  @Protected()
  @Put('change-password')
  changePassword(@Body() input: ChangePasswordInput, @AuthUser() user: string) {
    return this.usersService.changePassword(+user, input);
  }
}
