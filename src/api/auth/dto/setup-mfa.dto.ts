import { IsString } from 'class-validator';

import { IsCode } from '@/decorators/auth.decorators';

export class SetupMFAInput {
  @IsCode()
  readonly code: string;

  @IsString()
  readonly session: string;
}
