import { IsNotEmpty } from 'class-validator';
import { IsPassword } from 'src/decorators/auth.decorators';

import { EmailOnlyInput } from './email-only.dto';

export class SignupInput extends EmailOnlyInput {
  @IsPassword()
  @IsNotEmpty()
  password: string;
}
