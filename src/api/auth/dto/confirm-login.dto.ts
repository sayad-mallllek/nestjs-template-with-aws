import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';

import { SetupMFAInput } from './setup-mfa.dto';

export class ConfirmLoginInput extends SetupMFAInput {
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  email: string;
}
