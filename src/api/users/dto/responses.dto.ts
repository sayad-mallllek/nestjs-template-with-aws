import { ApiProperty } from '@nestjs/swagger';
import { UserRegistrationStepEnum } from '@prisma/client';

export class UserDTO {
  id: number;
  email: string;
  @ApiProperty({
    enum: UserRegistrationStepEnum,
    example: Object.keys(UserRegistrationStepEnum),
  })
  registrationStep: UserRegistrationStepEnum;
}
