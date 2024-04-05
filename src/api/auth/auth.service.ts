import {
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  AuthFlowType,
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  SignUpCommand,
  SignUpCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';
import { IdentityProviderEnum, UserRegistrationStepEnum } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const qs = require('qs');

import { PrismaService } from 'src/api/prisma/prisma.service';
import {
  ConfirmForgotPasswordException,
  DuplicateEmailException,
  InvalidUpdateUserException,
  LoginUserException,
  ResendConfirmationCodeException,
} from 'src/exceptions/auth.exceptions';

import { ConfirmSignupInput } from './dto/confirm-signup.dto';
import { EmailOnlyInput } from './dto/email-only.dto';
import { LoginInput } from './dto/login.dto';
import { ResetPasswordInput } from './dto/reset-passowrd.dto';
import { SignupInput } from './dto/signup.dto';
import { TranslatorService } from '@/integrations/translator/translator.service';

type AxiosResponse<T> = {
  data: T;
  status: number;
};

@Injectable()
export class AuthService implements OnModuleDestroy {
  private readonly client: CognitoIdentityProviderClient;
  private readonly clientId: string;
  private readonly poolId: string;
  private readonly domain: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly translator: TranslatorService,
  ) {
    this.client = new CognitoIdentityProviderClient({
      credentials: {
        accessKeyId: process.env.COGNITO_ACCESS_KEY_ID,
        secretAccessKey: process.env.COGNITO_SECRET_ACCESS_KEY,
      },
      region: process.env.COGNITO_REGION,
    });
    this.clientId = process.env.COGNITO_CLIENT_ID;
    this.poolId = process.env.COGNITO_USER_POOL_ID;
    this.domain = process.env.COGNITO_DOMAIN;
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

  private _sendCreateNewUserCommand(input: SignupInput) {
    const command = new SignUpCommand({
      ClientId: this.clientId,
      Username: input.email,
      Password: input.password,
    });

    return this.client.send(command);
  }

  private async _createNewUser(
    input: SignupInput,
    response: SignUpCommandOutput,
  ) {
    return this.prisma.user.create({
      data: {
        email: input.email,
        identityProviders: {
          connectOrCreate: {
            create: {
              provider: IdentityProviderEnum.COGNITO,
              sub: response.UserSub,
            },
            where: {
              sub: response.UserSub,
            },
          },
        },
      },
    });
  }

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

  private async _reSignup(input: SignupInput) {
    const deleteCommand = new AdminDeleteUserCommand({
      Username: input.email,
      UserPoolId: this.poolId,
    });

    await this.client.send(deleteCommand);
    await this.prisma.user.delete({ where: { email: input.email } });
    return this.signup(input);
  }

  async signup(input: SignupInput) {
    const { email } = input;

    try {
      const response = await this._sendCreateNewUserCommand(input);

      await this._createNewUser(input, response);
    } catch (error) {
      const { name } = error;

      if (name === 'UsernameExistsException') {
        const getUserCommand = new AdminGetUserCommand({
          UserPoolId: this.poolId,
          Username: email,
        });
        const user = await this.client.send(getUserCommand);

        if (user.UserStatus === 'UNCONFIRMED') return this._reSignup(input);

        throw new BadRequestException('Cet email est déjà utilisé');
      }

      throw error;
    }
  }

  async confirmSignup(input: ConfirmSignupInput) {
    try {
      console.log(input);
      return;
      await this._sendConfirmUserSignupCommand(input);
      await this._updateUserAfterSignupConfirmation(input.email);
    } catch (err) {
      return new InvalidUpdateUserException(err.message);
    }
  }

  async login(input: LoginInput) {
    try {
      const resp = await this._sendLoginCommand(input);

      return {
        accessToken: resp.AuthenticationResult.AccessToken,
        refreshToken: resp.AuthenticationResult.RefreshToken,
        expiresIn: resp.AuthenticationResult.ExpiresIn,
      };
    } catch (err) {
      throw new LoginUserException(err.message);
    }
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
