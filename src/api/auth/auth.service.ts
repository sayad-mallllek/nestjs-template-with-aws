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
  InitiateAuthCommandOutput,
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
import {
  DuplicateEmailException,
  InvalidUpdateUserException,
  LoginUserException,
  ResendConfirmationCodeException,
} from 'src/exceptions/auth.exceptions';
import { ExchangeTokenType } from 'src/types/auth.types';
import { SignupInput } from './dto/signup.dto';
import { LoginInput } from './dto/login.dto';
import { EmailOnlyInput } from './dto/email-only.dto';
import { ChangePasswordInput } from '../users/dto/change-password.dto';
import { ConfirmSignupInput } from './dto/confirm-signup.dto';

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

  private async _createNewUser(input: SignupInput) {

    const resp = await this._sendCreateNewUserCommand(input);

    await this.prisma.user.create({
      data: {
        email: input.email,
        registrationStep: resp.UserConfirmed
          ? UserRegistrationStepEnum.PENDING_CONFIRMATION
          : UserRegistrationStepEnum.DONE,
        sub: resp.UserSub,
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

  private _sendSetupMFACommand(session: string) {
    const softwareCommand = new AssociateSoftwareTokenCommand({
      Session: session,
    });

    return this.client.send(softwareCommand);
  }

  private async _handleLoginCommandResponse(resp: InitiateAuthCommandOutput) {
    switch (resp.ChallengeName) {
      case ChallengeNameType.NEW_PASSWORD_REQUIRED:
        return {
          ChallengeName: ChallengeNameType.NEW_PASSWORD_REQUIRED,
          Session: resp.Session,
        };
      case ChallengeNameType.MFA_SETUP:
        const res = await this._sendSetupMFACommand(resp.Session)
        return {
          ChallengeName: ChallengeNameType.MFA_SETUP,
          Session: res.Session,
          SecretCode: res.SecretCode,
        };
      default:
        return { ChallengeName: resp.ChallengeName, Session: resp.Session };
    }
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
      await this._sendConfirmUserSignupCommand(input);
      await this._updateUserAfterSignupConfirmation(input.email);
    } catch (err) {
      return new InvalidUpdateUserException(err.message);
    }
  }

  async login(input: LoginInput) {

    try {
      const resp = await this._sendLoginCommand(input);

      switch (resp.ChallengeName) {
        case ChallengeNameType.NEW_PASSWORD_REQUIRED:
          return {
            ChallengeName: ChallengeNameType.NEW_PASSWORD_REQUIRED,
            Session: resp.Session,
          };
        case ChallengeNameType.MFA_SETUP:
          const res = await this._sendSetupMFACommand(resp.Session)
          return {
            ChallengeName: ChallengeNameType.MFA_SETUP,
            Session: res.Session,
            SecretCode: res.SecretCode,
          };
        default:
          return { ChallengeName: resp.ChallengeName, Session: resp.Session };
      }
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
      if (name === 'CodeMismatchException' || name === 'ExpiredCodeException') {
        throw new BadRequestException('Code non valide');
      }
      if (name === 'LimitExceededException') {
        throw new BadRequestException(
          'Trop de tentatives, veuillez réessayer plus tard',
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
