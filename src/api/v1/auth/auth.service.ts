import {
  AssociateSoftwareTokenCommand,
  AssociateSoftwareTokenCommandOutput,
  AuthFlowType,
  ChallengeNameType,
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
  OnModuleDestroy,
} from '@nestjs/common';
import { UserRegistrationStepEnum } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const qs = require('qs');
import { firstValueFrom } from 'rxjs';

import { getUserFromToken } from '../../functions/auth.functions';
import { SignupAuthDto, SocialSignupDto } from './dto/initiate-auth.dto';
import { PrismaService } from 'src/api/prisma/prisma.service';
import { ExchangeTokenType } from 'src/types/v1/auth.types';

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

  async signup(input: SignupAuthDto) {
    if (input.byPassCode !== process.env.PASSWORD_BYPASS_CODE)
      return new HttpException('You cannot register an account currently', 403);
    try {
      const { password, ...newUserInput } = input;

      const command = new SignUpCommand({
        ClientId: this.clientId,
        Username: newUserInput.email,
        Password: password,
      });
      const res = await this.client.send(command);

      return this.prisma.user.create({
        data: { ...newUserInput, sub: res.UserSub },
      });

      // return this.login(newUserInput.email, password)
    } catch (error) {
      const { name } = error;
      if (name === 'UsernameExistsException') {
        throw new BadRequestException({
          type: 'username_already_exists',
          message: 'An account with the corresponding email already exists',
        });
      }
      throw error;
    }
  }

  async login(email: string, password: string) {
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

      let softwareToken: AssociateSoftwareTokenCommandOutput | undefined =
        undefined;
      let secretCode = null;

      if (auth.ChallengeName === ChallengeNameType.MFA_SETUP) {
        const softwareCommand = new AssociateSoftwareTokenCommand({
          Session: auth.Session,
        });

        softwareToken = await this.client.send(softwareCommand);

        await this.prisma.user.update({
          where: { email },
          data: {
            secretCode: softwareToken.SecretCode,
          },
        });
        secretCode = softwareToken.SecretCode;
      }

      if (!secretCode) {
        const user = await this.prisma.user.findUnique({
          where: { email },
          select: {
            secretCode: true,
          },
        });
        secretCode = user?.secretCode;
      }

      return { softwareToken, auth, secretCode };
    } catch (error) {
      const { name } = error;
      // email or password incorrect
      if (name === 'NotAuthorizedException') {
        throw new BadRequestException('Email or password is incorrect');
      }

      // user has correct credentials but is not confirmed
      if (name === 'UserNotConfirmedException') {
        throw new BadRequestException('User not confirmed');
      }

      throw error;
    }
  }

  async setupMFA(code: string, session: string) {
    const verifyCommand = new VerifySoftwareTokenCommand({
      UserCode: code,
      Session: session,
    });

    const verifyToken = await this.client.send(verifyCommand);
    return verifyToken;
  }

  async confirmLogin(email: string, code: string, session: string) {
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
      return await this.client.send(command);
    } catch (error) {
      console.log(error);
      const { name } = error;
      if (name === 'CodeMismatchException' || name === 'ExpiredCodeException') {
        throw new BadRequestException('Invalid code, please try again');
      }
      throw error;
    }
  }

  async confirmSignup(email: string, code: string, bypassCode?: string) {
    if (bypassCode !== process.env.PASSWORD_BYPASS_CODE)
      return new NotAuthorizedException({
        $metadata: {},
        message: 'You cannot register an account currently',
      });
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.clientId,
        ConfirmationCode: code,
        Username: email,
      });
      await this.client.send(command);

      const user = await this.prisma.user.update({
        where: {
          email,
        },
        data: {
          // REMOVE AFTER BETA
          // registrationStep: UserRegistrationStep.PENDING_PAYMENT,
          registrationStep: UserRegistrationStepEnum.DONE,
        },
      });
      return user;
    } catch (error) {
      console.log(error);
      const { name } = error;
      if (name === 'CodeMismatchException' || name === 'ExpiredCodeException') {
        throw new BadRequestException('Invalid code, please try again');
      }
      throw error;
    }
  }

  async resendConfirmationCode(email: string) {
    const command = new ResendConfirmationCodeCommand({
      ClientId: this.clientId,
      Username: email,
    });
    await this.client.send(command);
  }

  async refreshToken(refreshToken: string) {
    const command = new InitiateAuthCommand({
      ClientId: this.clientId,
      AuthFlow: AuthFlowType.REFRESH_TOKEN,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    });
    return this.client.send(command);
  }

  async socialSignup(sub: string, input: SocialSignupDto) {
    try {
      input;
      return await this.prisma.user.update({
        where: { sub },
        data: {
          ...input,
          registrationStep: UserRegistrationStepEnum.DONE,
        },
      });
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async socialLogin(code: string, redirectUri: string) {
    let res: AxiosResponse<ExchangeTokenType>;
    try {
      res = await firstValueFrom(
        this.httpService.post<ExchangeTokenType>(
          `${this.domain}/oauth2/token`,
          qs.stringify({
            grant_type: 'authorization_code',
            client_id: this.clientId,
            redirect_uri: redirectUri,
            code,
          }),
        ),
      );
    } catch (e) {
      throw new BadRequestException(e.message);
    }

    const { sub, email, given_name, family_name, phone_number } =
      getUserFromToken(res.data.id_token);
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user)
      await this.prisma.user.create({
        data: {
          registrationStep: UserRegistrationStepEnum.PENDING_PAYMENT,
          email,
          sub,
          firstName: given_name,
          lastName: family_name,
          phoneNumber: phone_number,
        },
      });

    const { access_token, id_token, refresh_token, expires_in } = res.data;
    return {
      AuthenticationResult: {
        AccessToken: access_token,
        IdToken: id_token,
        RefreshToken: refresh_token,
        ExpiresIn: expires_in,
      },
    };
  }

  async forgotPassword(email: string) {
    const count = await this.prisma.user.count({
      where: {
        email,
      },
    });

    if (count === 0) throw new BadRequestException('Email does not exist');

    try {
      const command = new ForgotPasswordCommand({
        ClientId: this.clientId,
        Username: email,
      });
      return await this.client.send(command);
    } catch (error) {
      throw new BadRequestException(error.message);
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
      throw new InternalServerErrorException(
        "Quelque chose s'est mal passé, veuillez réessayer alter",
      );
    }
  }
}
