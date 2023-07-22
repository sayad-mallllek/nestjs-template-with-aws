import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AssociateSoftwareTokenCommand,
  AuthFlowType,
  ChallengeNameType,
  ChangePasswordCommand,
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ForgotPasswordCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  RespondToAuthChallengeCommand,
  SignUpCommand,
  VerifySoftwareTokenCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  BadRequestException,
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';
import { Response } from 'express';
import {
  clearTokensFromCookie,
  getUserFromIdToken,
  setTokenstoCookie,
} from 'src/utils/functions/auth.functions';

import { LoginResponse } from './types/login';
import { AdminCreateUser } from './types/admin-create-user';
import { PrismaService } from 'src/api/prisma/prisma.service';

@Injectable()
export class AuthService implements OnModuleDestroy {
  private readonly client: CognitoIdentityProviderClient;
  private readonly clientId: string;

  constructor(private readonly prisma: PrismaService) {
    this.client = new CognitoIdentityProviderClient({
      credentials: {
        accessKeyId: process.env.COGNITO_ACCESS_KEY_ID,
        secretAccessKey: process.env.COGNITO_SECRET_KEY_ID,
      },
      region: process.env.COGNITO_REGION,
    });
    this.clientId = process.env.COGNITO_CLIENT_ID;
  }

  onModuleDestroy() {
    this.client.destroy();
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });
      const auth = await this.client.send(command);

      if (auth.ChallengeName === ChallengeNameType.MFA_SETUP) {
        const softwareCommand = new AssociateSoftwareTokenCommand({
          Session: auth.Session,
        });

        const res = await this.client.send(softwareCommand);
        return {
          ChallengeName: ChallengeNameType.MFA_SETUP,
          Session: res.Session,
          SecretCode: res.SecretCode,
        };
      } else if (
        auth.ChallengeName === ChallengeNameType.NEW_PASSWORD_REQUIRED
      ) {
        return {
          ChallengeName: ChallengeNameType.NEW_PASSWORD_REQUIRED,
          Session: auth.Session,
        };
      }

      return { ChallengeName: auth.ChallengeName, Session: auth.Session };
    } catch (error) {
      const { name } = error;
      if (name === 'NotAuthorizedException') {
        throw new BadRequestException('Incorrect email or password');
      }
      throw error;
    }
  }

  async forgetPassword(email: string) {
    try {
      const command = new ForgotPasswordCommand({
        ClientId: this.clientId,
        Username: email,
      });
      return await this.client.send(command);
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
        throw new BadRequestException('Invalid code');
      }
      throw error;
    }
  }

  async changePassword(
    accessToken: string,
    previousPassword: string,
    proposedPassword: string,
  ) {
    try {
      const command = new ChangePasswordCommand({
        AccessToken: accessToken,
        PreviousPassword: previousPassword,
        ProposedPassword: proposedPassword,
      });
      return await this.client.send(command);
    } catch (error) {
      const { name } = error;
      if (name === 'NotAuthorizedException') {
        throw new BadRequestException('Incorrect password');
      }
      throw error;
    }
  }

  async resendVerificationCode(email: string) {
    try {
      const command = new ResendConfirmationCodeCommand({
        ClientId: this.clientId,
        Username: email,
      });
      return await this.client.send(command);
    } catch (error) {
      throw error;
    }
  }

  async refreshToken(refreshToken: string, response: Response) {
    try {
      const command = new InitiateAuthCommand({
        ClientId: this.clientId,
        AuthFlow: AuthFlowType.REFRESH_TOKEN,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      });
      const res = await this.client.send(command);
      const { AccessToken, IdToken } = res.AuthenticationResult;
      setTokenstoCookie(AccessToken, IdToken, refreshToken, response);
      return res.AuthenticationResult;
    } catch (error) {
      throw error;
    }
  }

  async deleteUser(email: string) {
    const command = new AdminDeleteUserCommand({
      UserPoolId: process.env.COGNITO_POOL_ID,
      Username: email,
    });

    return await this.client.send(command);
  }

  async setupMFA(code: string, session: string) {
    const verifyCommand = new VerifySoftwareTokenCommand({
      Session: session,
      UserCode: code,
    });

    try {
      return await this.client.send(verifyCommand);
    } catch (error) {
      const { name } = error;
      if (
        name === 'CodeMismatchException' ||
        name === 'ExpiredCodeException' ||
        name === 'EnableSoftwareTokenMFAException'
      ) {
        throw new BadRequestException({
          message: 'Invalid code, please try again',
          name: 'CodeMismatchException',
        });
      }
      if (name === 'NotAuthorizedException')
        throw new BadRequestException({
          message: 'Session expired, please try again',
          name: 'NotAuthorizedException',
        });
      throw error;
    }
  }

  async confirmLogin(
    email: string,
    code: string,
    session: string,
    response: Response,
  ) {
    try {
      const command = new RespondToAuthChallengeCommand({
        ClientId: this.clientId,
        ChallengeName: ChallengeNameType.SOFTWARE_TOKEN_MFA,
        Session: session,
        ChallengeResponses: {
          USERNAME: email,
          SOFTWARE_TOKEN_MFA_CODE: code,
        },
      });
      const res = await this.client.send(command);
      const { AccessToken, IdToken, RefreshToken } = res.AuthenticationResult;
      setTokenstoCookie(AccessToken, IdToken, RefreshToken, response);
      const user = getUserFromIdToken(res.AuthenticationResult.IdToken);
      const { sub } = user;
      const userExists = await this.prisma.user.findUnique({ where: { sub } });
      if (!userExists)
        await this.prisma.user.create({
          data: { sub, email, role: user['cognito:role'] },
        });
      return res.AuthenticationResult;
    } catch (error) {
      const { name } = error;
      if (name === 'CodeMismatchException' || name === 'ExpiredCodeException') {
        throw new BadRequestException({
          message: 'Invalid code, please try again',
          name: 'CodeMismatchException',
        });
      }
      if (name === 'NotAuthorizedException')
        throw new BadRequestException({
          message: 'Session expired, please try again',
          name: 'NotAuthorizedException',
        });

      throw error;
    }
  }

  async signUp(email: string, password: string) {
    const command = new SignUpCommand({
      ClientId: this.clientId,
      Username: email,
      Password: password,
    });
    return this.client.send(command);
  }

  async newPassword(email: string, password: string, session: string) {
    const command = new RespondToAuthChallengeCommand({
      ClientId: this.clientId,
      ChallengeName: ChallengeNameType.NEW_PASSWORD_REQUIRED,
      Session: session,
      ChallengeResponses: {
        USERNAME: email,
        NEW_PASSWORD: password,
      },
    });

    try {
      return await this.client.send(command);
    } catch (error) {
      const { name } = error;
      if (name === 'NotAuthorizedException')
        throw new BadRequestException('Session expired, please try again');
      throw error;
    }
  }

  async logout(res: Response) {
    clearTokensFromCookie(res);
  }

  async adminCreateUser(data: AdminCreateUser) {
    const { email, role } = data;
    const cognitoRandomPassword = 'Password1!';

    const command = new AdminCreateUserCommand({
      UserPoolId: process.env.COGNITO_POOL_ID,
      Username: email,
      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },
        {
          Name: 'email_verified',
          Value: 'true',
        },
        {
          Name: 'custom:role',
          Value: role,
        },
      ],
      TemporaryPassword: cognitoRandomPassword,
    });

    try {
      const res = await this.client.send(command);
      return this.prisma.user.create({
        data: {
          sub: res.User.Username,
          email,
          role,
          ...data.data,
        },
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
