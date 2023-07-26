import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { ChangePasswordInput } from './dto/change-password.dto';

@Injectable()
export class UsersService {
    private readonly client: CognitoIdentityProviderClient;

    constructor(
        private readonly prisma: PrismaService,
    ) {
        this.client = new CognitoIdentityProviderClient({
            credentials: {
                accessKeyId: process.env.COGNITO_ACCESS_KEY_ID,
                secretAccessKey: process.env.COGNITO_SECRET_ACCESS_KEY,
            },
            region: process.env.COGNITO_REGION,
        });
    }

    onModuleDestroy() {
        this.client.destroy();
    }

    async getMe(userId: number) {
        return this.prisma.user.findUnique({
            where: {
                id: userId,
            },
        });
    }

    async changePassword(
        accessToken: string,
        input: ChangePasswordInput
    ) {
        try {
            const command = new ChangePasswordCommand({
                AccessToken: accessToken,
                PreviousPassword: input.oldPassword,
                ProposedPassword: input.newPassword,
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
}
