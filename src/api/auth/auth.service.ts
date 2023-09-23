import {
  AuthFlowType,
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  BadRequestException,
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';
import { UserRegistrationStepEnum } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const qs = require('qs');

import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/api/prisma/prisma.service';
import {
  ConfirmForgotPasswordException,
  DuplicateEmailException,
  InvalidUpdateUserException,
  ResendConfirmationCodeException,
} from 'src/exceptions/auth.exceptions';

import { isPassMatch } from '@/utils/functions/auth.functions';
import {
  signAccessToken,
  signRefreshToken,
} from '@/utils/functions/jwt.functions';

import { ConfirmSignupInput } from './dto/confirm-signup.dto';
import { EmailOnlyInput } from './dto/email-only.dto';
import { LoginInput } from './dto/login.dto';
import { ResetPasswordInput } from './dto/reset-passowrd.dto';
import { SignupInput } from './dto/signup.dto';

type AxiosResponse<T> = {
  data: T;
  status: number;
};

@Injectable()
export class AuthService implements OnModuleDestroy {
  private readonly client: CognitoIdentityProviderClient;
  private readonly clientId: string;
  private readonly domain: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.client = new CognitoIdentityProviderClient({
      credentials: {
        accessKeyId: configService.get('COGNITO_ACCESS_KEY_ID'),
        secretAccessKey: configService.get('COGNITO_SECRET_ACCESS_KEY'),
      },
      region: configService.get('COGNITO_REGION'),
    });
    this.clientId = configService.get('COGNITO_CLIENT_ID');
    this.domain = configService.get('COGNITO_DOMAIN');
  }

  onModuleDestroy() {
    this.client.destroy();
  }

  private async _checkIfEmailExists(email: string) {
    const emailCount = await this.prisma.user.count({
      where: {
        email,
      },
    });

    return emailCount > 0;
  }

  private async _createNewUser(input: SignupInput) {}

  private _sendConfirmUserSignupCommand(input: ConfirmSignupInput) {
    const command = new ConfirmSignUpCommand({
      ClientId: this.clientId,
      Username: input.email,
      ConfirmationCode: input.code,
    });

    return this.client.send(command);
  }

  private _updateUserAfterSignupConfirmation(email: string) {
    return this.prisma.user.update({
      where: {
        email,
      },
      data: {
        registrationStep: UserRegistrationStepEnum.DONE,
      },
    });
  }

  private _sendLoginCommand(input: LoginInput) {
    const command = new InitiateAuthCommand({
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: this.clientId,
      AuthParameters: {
        USERNAME: input.email,
        PASSWORD: input.password,
      },
    });

    return this.client.send(command);
  }

  private _sendResendConfirmationCodeCommand(input: EmailOnlyInput) {
    const command = new ResendConfirmationCodeCommand({
      ClientId: this.clientId,
      Username: input.email,
    });

    return this.client.send(command);
  }

  private _sendForgotPasswordCommand(email: string) {
    const command = new ForgotPasswordCommand({
      ClientId: this.clientId,
      Username: email,
    });

    return this.client.send(command);
  }

  private _sendConfirmForgotPasswordCommand(input: ResetPasswordInput) {
    const command = new ConfirmForgotPasswordCommand({
      ClientId: this.clientId,
      ConfirmationCode: input.code,
      Password: input.password,
      Username: input.email,
    });
    return this.client.send(command);
  }

  private _sendRefreshTokenCommand(refreshToken: string) {
    const command = new InitiateAuthCommand({
      ClientId: this.clientId,
      AuthFlow: AuthFlowType.REFRESH_TOKEN,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    });

    return this.client.send(command);
  }

  private async sendConfirmEmail(input: unknown) {
    /*
            Implementation is empty due to the diverse choices of emails.
            You may use the MailService class's "sendTemplateEmail" method to send your email.
            */
  }

  async signup(input: SignupInput) {
    if (this._checkIfEmailExists(input.email))
      throw new DuplicateEmailException();

    try {
      await this._createNewUser(input);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async confirmSignup(input: ConfirmSignupInput) {
    try {
      // await this._sendConfirmUserSignupCommand(input);
      // await this._updateUserAfterSignupConfirmation(input.email);
      await this.prisma.user.update({
        where: {
          email: input.email,
        },
        data: {
          registrationStep: UserRegistrationStepEnum.DONE,
        },
      });
    } catch (err) {
      return new InvalidUpdateUserException(err.message);
    }
  }

  async login(input: LoginInput) {
    const user = await this.prisma.user.findFirst({
      where: { email: input.email },
    });
    if (!user || !(await isPassMatch(input.password, user.password)))
      throw new BadRequestException('incorrect login credentials');
    if (
      user.registrationStep === UserRegistrationStepEnum.PENDING_CONFIRMATION
    ) {
      await this.sendConfirmEmail({ email: user.email });
      throw new BadRequestException(
        'To verify your email please check your inbox',
      );
    }
    const { password: _, ...userProps } = user;

    const accessToken = signAccessToken(user.id.toString());
    const refreshToken = signRefreshToken(user.id.toString());

    return { user: userProps, accessToken, refreshToken };
  }

  async resendConfirmationCode(input: EmailOnlyInput) {
    try {
      await this._sendResendConfirmationCodeCommand(input);
    } catch (error) {
      throw new ResendConfirmationCodeException(error.message);
    }
  }

  async forgotPassword(email: string) {
    try {
      await this._sendForgotPasswordCommand(email);
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(input: ResetPasswordInput) {
    try {
      return await this._sendConfirmForgotPasswordCommand(input);
    } catch (error) {
      throw new ConfirmForgotPasswordException(error.name, error.message);
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      return await this._sendRefreshTokenCommand(refreshToken);
    } catch (error) {
      throw error;
    }
  }
}
