import { IsNotEmpty, IsString } from 'class-validator';

import { EmailOnlyInput } from './email-only.dto';

export class LoginInput extends EmailOnlyInput {
  @IsString()
  @IsNotEmpty()
  password: string;
}
