import {
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  AuthFlowType,
  ChangePasswordCommand,
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import qs from "qs";
import { customAlphabet } from "nanoid";
import { SignUpDto } from "./dto/sign-up.dto";
import { IdentityProviderEnum } from "@prisma/client";
import { AuthGuard } from "./auth.guard";
import { CreateUserInput, IdCognitoUser } from "./auth.types";
import { ALPHANUMERIC_STRING } from "src/utils/constants/util.constants";

@Injectable()
export class AuthService implements OnModuleDestroy {
  private readonly client: CognitoIdentityProviderClient;
  private readonly clientId: string;
  private readonly poolId: string;
  private readonly domain: string;

  constructor(private readonly prisma: PrismaService) {
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

  private async _createUser(input: CreateUserInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    const newIdentityProvider = {
      create: {
        sub: input.sub,
        provider: input.identityProvider,
      },
    };

    // if user has not already signed up (using a social provider) we create them and handle the sponsor code
    if (!user) {
      if (input.friendSponsorCode) {
        const sponsor = await this.prisma.user.findUnique({
          where: { sponsorCode: input.friendSponsorCode },
        });

        if (!sponsor)
          throw new BadRequestException("Le code de parrainage est invalide");

        // TODO: handle sponsor code
        // handleSponsorCode(sponsor, data);
      }

      await this.prisma.user.create({
        data: {
          ...input.data,
          email: input.email,
          sponsorCode: customAlphabet(ALPHANUMERIC_STRING, 7)(),
          identityProviders: newIdentityProvider,
        },
      });

      return;
    }

    await this.prisma.user.update({
      where: { email: input.email },
      data: {
        identityProviders: newIdentityProvider,
      },
    });
  }

  async signup(input: SignUpDto): Promise<{ message: string }> {
    const {
      password: _password,
      sponsorCode: friendSponsorCode,
      ...data
    } = input;

    try {
      const command = new SignUpCommand({
        ClientId: this.clientId,
        Username: input.email,
        Password: input.password,
      });
      const resp = await this.client.send(command);

      await this._createUser({
        email: input.email,
        identityProvider: IdentityProviderEnum.COGNITO,
        sub: resp.UserSub,
        friendSponsorCode,
        data,
      });
      return {
        message: "Votre compte a bien été créé",
      };
    } catch (error) {
      const { name } = error;

      if (name === "UsernameExistsException") {
        const getUserCommand = new AdminGetUserCommand({
          UserPoolId: this.poolId,
          Username: input.email,
        });
        const user = await this.client.send(getUserCommand);

        if (user.UserStatus === "UNCONFIRMED") {
          const deleteCommand = new AdminDeleteUserCommand({
            Username: input.email,
            UserPoolId: this.poolId,
          });

          await this.client.send(deleteCommand);
          await this.prisma.user.delete({
            where: {
              email: input.email,
            },
          });

          return this.signup(input);
        }

        throw new BadRequestException("Cet email est déjà utilisé");
      }

      throw error;
    }
  }

  async confirmSignup(email: string, code: string) {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.clientId,
        ConfirmationCode: code,
        Username: email,
      });
      await this.client.send(command);
      return {
        message: "Votre compte a bien été confirmé",
      };
    } catch (error) {
      Logger.error(error);
      const { name } = error;
      if (name === "CodeMismatchException" || name === "ExpiredCodeException") {
        throw new BadRequestException("Code invalide");
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

  async login(email: string, password: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email,
        },
      });

      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });
      const res = await this.client.send(command);

      return {
        userId: user.id,
        accessToken: res.AuthenticationResult.AccessToken,
        refreshToken: res.AuthenticationResult.RefreshToken,
      };
    } catch (error) {
      const { name } = error;
      if (name === "NotAuthorizedException") {
        throw new BadRequestException("E-mail ou mot de passe incorrect");
      }
      throw error;
    }
  }

  async socialLogin(code: string, redirectUri: string) {
    const fetchRes = await fetch(`https://${this.domain}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: qs.stringify({
        grant_type: "authorization_code",
        client_id: this.clientId,
        redirect_uri: redirectUri,
        code,
      }),
    });

    const res = await fetchRes.json();

    const user = (await AuthGuard.getUserFromToken(
      res.data.id_token,
      "id",
    )) as IdCognitoUser;

    console.log(user);

    throw new BadRequestException("Not implemented");

    const { sub, identities, email, name } = user;

    const providerType =
      identities[0].providerName.toUpperCase() as IdentityProviderEnum;

    await this._createUser({
      email,
      identityProvider: providerType,
      sub,
      data: {
        name: name,
        description: "",
      },
    });

    return {
      AuthenticationResult: {
        AccessToken: res.data.access_token,
        RefreshToken: res.data.refresh_token,
      },
    };
  }

  async forgotPassword(email: string) {
    try {
      const command = new ForgotPasswordCommand({
        ClientId: this.clientId,
        Username: email,
      });

      await this.client.send(command);

      return {
        message: "Un code de confirmation vous a été envoyé par e-mail",
      };
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

  async changePassword(
    accessToken: string,
    oldPassword: string,
    newPassword: string,
  ) {
    try {
      const command = new ChangePasswordCommand({
        AccessToken: accessToken,
        PreviousPassword: oldPassword,
        ProposedPassword: newPassword,
      });
      return await this.client.send(command);
    } catch (error) {
      const { name } = error;
      if (name === "NotAuthorizedException") {
        throw new BadRequestException("Le mot de passe est incorrect");
      }
      throw error;
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

  async getMe(userId: number) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        favoriteProducts: true,
      },
    });
  }
}
