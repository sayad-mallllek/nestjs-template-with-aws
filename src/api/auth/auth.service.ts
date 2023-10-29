import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRegistrationStepEnum } from '@prisma/client';
import { PrismaService } from 'src/api/prisma/prisma.service';
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
import {
  signAccessToken,
  signRefreshToken,
} from '@/utils/functions/jwt.functions';

import { ConfirmSignupInput } from './dto/confirm-signup.dto';
import { EmailOnlyInput } from './dto/email-only.dto';
import { LoginInput } from './dto/login.dto';
import { ResetPasswordInput } from './dto/reset-passowrd.dto';
import { SignupInput } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private async _createTokens(userId: string) {
    const accessToken = signAccessToken(userId);
    const refreshToken = signRefreshToken(userId);

    return { accessToken, refreshToken };
  }

  private async _checkIfEmailExists(email: string) {
    const emailCount = await this.prisma.user.count({
      where: {
        email,
      },
    });

    return emailCount > 0;
  }

  private async _createNewUser(input: SignupInput) {
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
    } catch (error) {
      throw error;
    }
  }

  private async _checkUserCredentialsAndGetUser(input: LoginInput) {
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
      throw new BadRequestException('incorrect login credentials');

    return user;

    // if (
    //   user.registrationStep === UserRegistrationStepEnum.PENDING_CONFIRMATION
    // ) {
    //   await this._sendConfirmEmail({ email: user.email });
    //   throw new UserNotConfirmedException();
    // }
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
      throw new DuplicateEmailException();

    try {
      await this._createNewUser(input);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async confirmSignup(input: ConfirmSignupInput) {
    try {
      if (await this._checkIfUserCodeMatches(input))
        await this._confirmUserSignup(input);
      throw new ConfirmSignupException('invalid code');
    } catch (err) {
      return new ConfirmSignupException(err.message);
    }
  }

  async login(input: LoginInput) {
    const user = await this._checkUserCredentialsAndGetUser(input);

    if (
      user.registrationStep === UserRegistrationStepEnum.PENDING_CONFIRMATION
    ) {
      await this._sendConfirmEmail({ email: user.email });
      throw new UserNotConfirmedException();
    }

    return this._createTokens(user.id.toString());
  }

  async resendConfirmationCode(input: EmailOnlyInput) {
    try {
      await this._sendConfirmEmail(input);
    } catch (error) {
      throw new ResendConfirmationCodeException(error.message);
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
      const token = extractToken(refreshToken);
      const user = getUserFromToken(token);

      return this._createTokens(user.id);
    } catch (error) {
      throw error;
    }
  }
}
