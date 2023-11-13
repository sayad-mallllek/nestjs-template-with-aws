import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordInput } from './dto/change-password.dto';
import { hashPass, isPassMatch } from '@/utils/functions/auth.functions';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private async _checkIfOldPasswordIsValid(
    userId: number,
    password: string,
    oldPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      return false;
    }
    return isPassMatch(password, oldPassword);
  }

  private async _updatePassword(userId: number, password: string) {
    const hashedPassword = await hashPass(password);
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashedPassword,
      },
    });
  }

  async getMe(userId: number) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        registrationStep: true,
      },
    });
  }

  async changePassword(userId: number, input: ChangePasswordInput) {
    if (
      !(await this._checkIfOldPasswordIsValid(
        userId,
        input.oldPassword,
        input.newPassword,
      ))
    )
      throw new BadRequestException('Old password is invalid');
    try {
      await this._updatePassword(userId, input.newPassword);
    } catch (error) {
      throw new BadRequestException('Failed to change password');
    }
  }
}
