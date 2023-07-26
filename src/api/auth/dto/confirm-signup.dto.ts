import { IsEmail, IsNotEmpty } from "class-validator";
import { Transform } from "class-transformer";
import { IsCode } from "src/decorators/auth.decorators";
import { EmailOnlyInput } from "./email-only.dto";

export class ConfirmSignupInput extends EmailOnlyInput {
    @IsNotEmpty()
    @IsCode()
    code: string;
}
