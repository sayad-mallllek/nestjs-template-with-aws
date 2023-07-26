import { IsEmail, IsNotEmpty } from "class-validator";
import { Transform } from "class-transformer";
import { IsPassword } from "src/decorators/auth.decorators";
import { EmailOnlyInput } from "../../auth/dto/email-only.dto";

export class ChangePasswordInput {
    @IsPassword()
    @IsNotEmpty()
    oldPassword: string;

    @IsPassword()
    @IsNotEmpty()
    newPassword: string;
}
