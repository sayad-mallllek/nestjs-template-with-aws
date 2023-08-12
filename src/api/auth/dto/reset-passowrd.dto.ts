import { IsEmail, IsNotEmpty } from "class-validator";
import { Transform } from "class-transformer";
import { IsCode, IsPassword } from "src/decorators/auth.decorators";
import { EmailOnlyInput } from "./email-only.dto";

export class ResetPasswordInput extends EmailOnlyInput {
    @IsNotEmpty()
    @IsCode()
    code: string;

    @IsPassword()
    password: string;
}
