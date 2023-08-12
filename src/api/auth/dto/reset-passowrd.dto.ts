import { IsNotEmpty } from 'class-validator';
import { IsCode, IsPassword } from 'src/decorators/auth.decorators';

import { EmailOnlyInput } from './email-only.dto';

export class ResetPasswordInput extends EmailOnlyInput {
  @IsNotEmpty()
  @IsCode()
  code: string;

  @IsPassword()
  password: string;
}
