import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRegistrationStepEnum } from '@prisma/client';
import { PrismaService } from 'src/api/prisma/prisma.service';

import { TranslatorService } from '@/integrations/translator/translator.service';
import { hashPass, isPassMatch } from '@/utils/functions/auth.functions';

import { UserDTO } from '../users/dto/responses.dto';
import {
  ConfirmSignupInput,
  EmailOnlyInput,
  LoginInput,
  ResetPasswordInput,
  SignupInput,
} from './dto/inputs.dto';
import { AuthTokens } from './dto/response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
    private readonly translatorService: TranslatorService,
  ) {}

  private _createTokens(userId: string) {
    const payload = { id: userId };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      secret: process.env.JWT_SECRET,
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      secret: process.env.JWT_SECRET,
    });

    return { accessToken, refreshToken };
  }

  private _getUserFromToken(token: string) {
    if (this.jwtService.verify(token))
      return this.jwtService.decode(token) as { id: string };
  }

  private async _checkIfEmailExists(email: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
      },
    });

    return !!user;
  }

  private async _createNewUserOrThrow(input: SignupInput) {
    const { password, email } = input;

    const newPassword = await hashPass(password);

    try {
      await this.prisma.user.create({
        data: {
          email,
          password: newPassword,
          registrationStep: UserRegistrationStepEnum.PENDING_CONFIRMATION,
        },
      });

      await this._sendConfirmEmail({ email });
    } catch (error) {
      throw new BadRequestException({
        type: 'user_creation_failed',
        message: error.message,
      });
    }
  }

  private async _checkUserCredentialsAndGetUserOrThrow(input: LoginInput) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: input.email,
      },
      select: {
        id: true,
        email: true,
        registrationStep: true,
        password: true,
      },
    });

    if (!user || !(await isPassMatch(input.password, user.password)))
      throw new BadRequestException({
        type: 'user_authentication_failed',
        message: this.translatorService.translate(
          'auth.errors.incorrect_email_or_password',
        ),
      });

    return user;
  }

  private async _sendConfirmationEmailAndThrowIfUserIsNotConfirmed(
    user: UserDTO,
  ) {
    if (
      user.registrationStep === UserRegistrationStepEnum.PENDING_CONFIRMATION
    ) {
      await this._sendConfirmEmail({ email: user.email });
      throw new BadRequestException({
        type: 'user_not_confirmed',
        message: this.translatorService.translate(
          'auth.errors.user_already_confirmed',
        ),
      });
    }
  }

  private async _checkIfUserCodeMatches(input: ConfirmSignupInput) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: input.email,
      },
      select: {
        signupCode: true,
      },
    });

    return user?.signupCode !== input.code;
  }

  private async _confirmUserSignup(input: ConfirmSignupInput) {
    return this.prisma.user.update({
      where: {
        email: input.email,
      },
      data: {
        registrationStep: UserRegistrationStepEnum.DONE,
      },
    });
  }

  private async _sendConfirmEmail(input: unknown) {
    /*
                            Implementation is empty due to the diverse choices of emails.
                            You may use the MailService class's "sendTemplateEmail" method to send your email.
                            */
  }

  private async _sendResetPasswordEmail(input: unknown) {
    /*
                            Implementation is empty due to the diverse choices of emails.
                            You may use the MailService class's "sendTemplateEmail" method to send your email.
                            */
  }

  private async _checkIfResetCodeMatches(
    input: ResetPasswordInput,
    userId: number,
  ) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: userId,
        },
        select: {
          lastResetCode: true,
        },
      });
      return user?.lastResetCode !== input.code;
    } catch (error) {
      throw new InternalServerErrorException({
        type: 'check_reset_code_failed',
        message: error.message,
      });
    }
  }

  private async _resetPassword(input: ResetPasswordInput, userId: number) {
    const newPasswordHashed = await hashPass(input.password);
    try {
      await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          password: newPasswordHashed,
        },
      });
    } catch (error) {
      throw new BadRequestException({
        type: 'check_reset_code_failed',
        message: error.message,
      });
    }
  }

  async signup(input: SignupInput) {
    if (await this._checkIfEmailExists(input.email))
      throw new BadRequestException({
        type: 'duplicate_email',
        message: this.translatorService.translate(
          'auth.errors.duplicate_email',
        ),
      });

    await this._createNewUserOrThrow(input);
  }

  async confirmSignup(input: ConfirmSignupInput) {
    try {
      if (await this._checkIfUserCodeMatches(input))
        await this._confirmUserSignup(input);
      throw new BadRequestException({
        type: 'invalid_code',
        message: this.translatorService.translate('auth.errors.invalid_code'),
      });
    } catch (err) {
      return new BadRequestException({
        type: 'confirm_signup_failed',
        message: err.message,
      });
    }
  }

  async login(input: LoginInput): Promise<AuthTokens> {
    const user = await this._checkUserCredentialsAndGetUserOrThrow(input);

    await this._sendConfirmationEmailAndThrowIfUserIsNotConfirmed(user);

    return this._createTokens(user.id.toString());
  }

  async resendConfirmationCode(input: EmailOnlyInput) {
    try {
      await this._sendConfirmEmail(input);
    } catch (error) {
      throw new BadRequestException({
        type: 'resend_confirmation_code_failed',
        message: error.message,
      });
    }
  }

  async forgotPassword(email: string) {
    try {
      await this._sendResetPasswordEmail(email);
    } catch (error) {
      throw new InternalServerErrorException({
        type: 'forgot_password_failed',
        message: error.message,
      });
    }
  }

  async resetPassword(input: ResetPasswordInput, userId: number) {
    if (await this._checkIfResetCodeMatches(input, userId))
      await this._resetPassword(input, userId);
    throw new BadRequestException({
      type: 'invalid_code',
      message: this.translatorService.translate('auth.errors.invalid_code'),
    });
  }

  async refreshToken(refreshToken: string) {
    const user = this._getUserFromToken(refreshToken);
    if (user) return this._createTokens(user.id);
    throw new BadRequestException({
      type: 'invalid_refresh_token',
      message: this.translatorService.translate(
        'auth.errors.invalid_refresh_token',
      ),
    });
  }
}
