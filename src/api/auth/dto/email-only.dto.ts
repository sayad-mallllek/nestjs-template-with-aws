import { IsEmail, IsNotEmpty } from "class-validator";
import { Transform } from "class-transformer";

export class EmailOnlyInput {
    @IsNotEmpty()
    @IsEmail()
    @Transform(({ value }) => value.toLowerCase())
    email: string;
}
