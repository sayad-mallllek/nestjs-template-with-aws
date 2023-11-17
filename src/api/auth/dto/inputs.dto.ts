import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { IsCode, IsPassword } from 'src/decorators/auth.decorators';

export class EmailOnlyInput {
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  email: string;
}

export class LoginInput extends EmailOnlyInput {
  @IsPassword()
  @IsNotEmpty()
  password: string;
}

export class SignupInput extends EmailOnlyInput {
  @IsPassword()
  @IsNotEmpty()
  password: string;
}

export class ConfirmSignupInput extends EmailOnlyInput {
  @IsNotEmpty()
  @IsCode()
  code: string;
}

export class RefreshTokenInput {
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}

export class ResetPasswordInput {
  @IsNotEmpty()
  @IsCode()
  code: string;

  @IsPassword()
  password: string;
}
