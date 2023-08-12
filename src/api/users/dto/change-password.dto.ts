import { IsNotEmpty } from 'class-validator';
import { IsPassword } from 'src/decorators/auth.decorators';

export class ChangePasswordInput {
  @IsPassword()
  @IsNotEmpty()
  oldPassword: string;

  @IsPassword()
  @IsNotEmpty()
  newPassword: string;
}
