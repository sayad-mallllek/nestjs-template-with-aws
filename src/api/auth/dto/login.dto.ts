import { IsEmail, IsNotEmpty } from "class-validator";
import { Transform } from "class-transformer";
import { IsPassword } from "src/decorators/auth.decorators";
import { EmailOnlyInput } from "./email-only.dto";

export class LoginInput extends EmailOnlyInput {

    @IsPassword()
    @IsNotEmpty()
    password: string;
}
