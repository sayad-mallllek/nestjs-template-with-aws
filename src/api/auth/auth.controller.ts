import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

import { AuthUser } from '@/decorators/auth.decorators';

import { AuthService } from './auth.service';
import {
  ConfirmSignupInput,
  EmailOnlyInput,
  LoginInput,
  RefreshTokenInput,
  ResetPasswordInput,
  SignupInput,
} from './dto/inputs.dto';
import { AuthTokens } from './dto/response.dto';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiResponse({ status: 200, type: AuthTokens })
  @HttpCode(200)
  @Post('login')
  login(@Body() input: LoginInput) {
    return this.authService.login(input);
  }

  @Post('signup')
  signup(@Body() input: SignupInput) {
    return this.authService.signup(input);
  }

  @Post('confirm-signup')
  confirmSignup(@Body() input: ConfirmSignupInput) {
    return this.authService.confirmSignup(input);
  }

  @Post('resend-confirmation-code')
  resendConfirmationCode(@Body() input: EmailOnlyInput) {
    return this.authService.resendConfirmationCode(input);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() input: ResetPasswordInput,
    @AuthUser() user: number,
  ) {
    return this.authService.resetPassword(input, user);
  }

  @ApiResponse({ status: 200, type: AuthTokens })
  @Post('refresh-token')
  async refreshToken(@Body() { refreshToken }: RefreshTokenInput) {
    return this.authService.refreshToken(refreshToken);
  }
}
