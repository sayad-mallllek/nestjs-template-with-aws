import {
  AssociateSoftwareTokenCommand,
  AssociateSoftwareTokenCommandOutput,
  AuthFlowType,
  ChallengeNameType,
  ChangePasswordCommand,
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  InitiateAuthCommand,
  NotAuthorizedException,
  ResendConfirmationCodeCommand,
  RespondToAuthChallengeCommand,
  SignUpCommand,
  VerifySoftwareTokenCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { UserRegistrationStepEnum } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const qs = require('qs');
import { firstValueFrom } from 'rxjs';

import { PrismaService } from 'src/api/prisma/prisma.service';
import { DuplicateEmailException, InvalidUpdateUserException, LoginUserException, ResendConfirmationCodeException } from 'src/exceptions/auth.exceptions';
import { ExchangeTokenType } from 'src/types/auth.types';
import { SignupInput } from './dto/signup.dto';
import { LoginInput } from './dto/login.dto';
import { EmailOnlyInput } from './dto/email-only.dto';
import { ChangePasswordInput } from '../users/dto/change-password.dto';

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
    private readonly httpService: HttpService,
  ) {
    this.client = new CognitoIdentityProviderClient({
      credentials: {
        accessKeyId: process.env.COGNITO_ACCESS_KEY_ID,
        secretAccessKey: process.env.COGNITO_SECRET_ACCESS_KEY,
      },
      region: process.env.COGNITO_REGION,
    });
    this.clientId = process.env.COGNITO_CLIENT_ID;
    this.domain = process.env.COGNITO_DOMAIN;
  }

  onModuleDestroy() {
    this.client.destroy();
  }

  async signup(input: SignupInput) {
    const emailCount = await this.prisma.user.count({
      where: {
        email: input.email,
      },
    });

    if (emailCount > 0) {
      throw new DuplicateEmailException();
    }

    const command = new SignUpCommand({
      ClientId: this.clientId,
      Username: input.email,
      Password: input.password,
    });

    try {
      const resp = await this.client.send(command);

      await this.prisma.user.create({
        data: {
          email: input.email,
          registrationStep: resp.UserConfirmed
            ? UserRegistrationStepEnum.PENDING_CONFIRMATION
            : UserRegistrationStepEnum.DONE,
          sub: resp.UserSub,
        },
      });

    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async confirmSignup(input: any) {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.clientId,
        Username: input.email,
        ConfirmationCode: input.code,
      });

      await this.client.send(command);

      await this.prisma.user.update({
        where: {
          email: input.email,
        },
        data: {
          registrationStep: UserRegistrationStepEnum.DONE,
        }
      })
    } catch (err) {
      return new InvalidUpdateUserException(err.message)
    }

  }

  async login(input: LoginInput) {
    const command = new InitiateAuthCommand({
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: this.clientId,
      AuthParameters: {
        USERNAME: input.email,
        PASSWORD: input.password,
      },
    });

    try {
      const resp = await this.client.send(command);

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
      const command = new ResendConfirmationCodeCommand({
        ClientId: this.clientId,
        Username: input.email,
      });
      await this.client.send(command);
    } catch (error) {
      throw new ResendConfirmationCodeException(error.message)
    }

  }

  async forgotPassword(email: string) {
    try {
      const command = new ForgotPasswordCommand({
        ClientId: this.clientId,
        Username: email,
      });

      await this.client.send(command);

    } catch (error) {
      throw error;
    }
  }

  async confirmForgotPassword(email: string, code: string, password: string) {
    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: this.clientId,
        ConfirmationCode: code,
        Password: password,
        Username: email,
      });
      return await this.client.send(command);
    } catch (error) {
      const { name } = error;
      if (name === "CodeMismatchException" || name === "ExpiredCodeException") {
        throw new BadRequestException("Code non valide");
      }
      if (name === "LimitExceededException") {
        throw new BadRequestException(
          "Trop de tentatives, veuillez réessayer plus tard",
        );
      }
      Logger.error(error);
      throw new InternalServerErrorException(
        "Quelque chose s'est mal passé, veuillez réessayer alter",
      );
    }
  }



  async refreshToken(refreshToken: string) {
    try {
      const command = new InitiateAuthCommand({
        ClientId: this.clientId,
        AuthFlow: AuthFlowType.REFRESH_TOKEN,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      });
      return await this.client.send(command);
    } catch (error) {
      throw error;
    }
  }
}
