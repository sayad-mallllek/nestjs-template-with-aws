import { IsNotEmpty } from 'class-validator';
import { IsCode, IsPassword } from 'src/decorators/auth.decorators';

export class ResetPasswordInput {
  @IsNotEmpty()
  @IsCode()
  code: string;

  @IsPassword()
  password: string;
}
