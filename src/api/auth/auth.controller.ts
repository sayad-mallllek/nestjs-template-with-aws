import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from './auth.service';
import { ConfirmLoginInput } from './dto/confirm-login.dto';
import { ConfirmSignupInput } from './dto/confirm-signup.dto';
import { EmailOnlyInput } from './dto/email-only.dto';
import { LoginInput } from './dto/login.dto';
import { RefreshTokenInput } from './dto/refresh-token.dto';
import { ResetPasswordInput } from './dto/reset-passowrd.dto';
import { SetupMFAInput } from './dto/setup-mfa.dto';
import { SignupInput } from './dto/signup.dto';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() input: LoginInput) {
    return this.authService.login(input);
  }

  @Post('setup-mfa')
  setupMFA(@Body() input: SetupMFAInput) {
    return this.authService.setupMFA(input);
  }

  @Post('confirm-login')
  async confirmLogin(@Body() input: ConfirmLoginInput) {
    return this.authService.confirmLogin(input);
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
  async resetPassword(@Body() input: ResetPasswordInput) {
    return this.authService.resetPassword(input);
  }

  @Post('refresh-token')
  async refreshToken(@Body() { refreshToken }: RefreshTokenInput) {
    const res = await this.authService.refreshToken(refreshToken);
    return { accessToken: res.AuthenticationResult.AccessToken };
  }
}
