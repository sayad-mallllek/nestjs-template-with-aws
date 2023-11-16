import { BadRequestException, Injectable } from '@nestjs/common';
import { UserRegistrationStepEnum } from '@prisma/client';
import { PrismaService } from 'src/api/prisma/prisma.service';
import { I18nContext, I18nService, Path, TranslateOptions } from 'nestjs-i18n';
import {
  ConfirmForgotPasswordException,
  ConfirmSignupException,
  DuplicateEmailException,
  ResendConfirmationCodeException,
  UserNotConfirmedException,
} from 'src/exceptions/auth.exceptions';

import {
  extractToken,
  getUserFromToken,
  hashPass,
  isPassMatch,
} from '@/utils/functions/auth.functions';

import { ConfirmSignupInput } from './dto/confirm-signup.dto';
import { EmailOnlyInput } from './dto/email-only.dto';
import { LoginInput } from './dto/login.dto';
import { ResetPasswordInput } from './dto/reset-passowrd.dto';
import { SignupInput } from './dto/signup.dto';
import { JwtService } from '@nestjs/jwt';
import { PathImpl2 } from '@nestjs/config';
import { I18nTranslations } from '@/types/i18n.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
    private readonly i18n: I18nService,
  ) {}

  private t(key: PathImpl2<I18nTranslations>, options?: TranslateOptions) {
    return this.i18n.t(key, {
      lang: I18nContext.current().lang,
      ...options,
    });
  }

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
    const emailCount = await this.prisma.user.count({
      where: {
        email,
      },
    });

    return emailCount > 0;
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
        message: this.t('auth.errors.incorrect_email_or_password'),
      });

    return user;
  }

  private async _checkIfUserCodeMatches(input: ConfirmSignupInput) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: input.email,
      },
      select: {
        signupCode: true,
      },
    });

    return user.signupCode !== input.code;
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
      const { lastResetCode } = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          lastResetCode: true,
        },
      });
      return lastResetCode !== input.code;
    } catch (error) {
      throw error;
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
      throw error;
    }
  }

  async signup(input: SignupInput) {
    if (await this._checkIfEmailExists(input.email))
      throw new BadRequestException({
        type: 'duplicate_email',
        message: this.t('auth.errors.duplicate_email'),
      });

    try {
      await this._createNewUserOrThrow(input);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async confirmSignup(input: ConfirmSignupInput) {
    try {
      if (await this._checkIfUserCodeMatches(input))
        await this._confirmUserSignup(input);
      throw new BadRequestException({
        type: 'invalid_code',
        message: this.t('auth.errors.invalid_code'),
      });
    } catch (err) {
      return new BadRequestException({
        type: 'confirm_signup_failed',
        message: err.message,
      });
    }
  }

  async login(input: LoginInput) {
    const user = await this._checkUserCredentialsAndGetUserOrThrow(input);

    if (
      user.registrationStep === UserRegistrationStepEnum.PENDING_CONFIRMATION
    ) {
      await this._sendConfirmEmail({ email: user.email });
      throw new BadRequestException({
        type: 'user_not_confirmed',
        message: this.t('auth.errors.user_not_confirmed'),
      });
    }

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
      throw error;
    }
  }

  async resetPassword(input: ResetPasswordInput, userId: number) {
    try {
      if (await this._checkIfResetCodeMatches(input, userId))
        return this._resetPassword(input, userId);
    } catch (error) {
      throw new ConfirmForgotPasswordException(error.name, error.message);
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const user = this._getUserFromToken(refreshToken);
      if (user) return this._createTokens(user.id);
    } catch (error) {
      throw error;
    }
  }
}
