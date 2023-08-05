import { getConfirmPasswordExceptionGeneralErrorMessage } from "@/utils/functions/auth.functions";
import { BadRequestException, HttpException, HttpStatus } from "@nestjs/common";

export class DuplicateEmailException extends BadRequestException {
    constructor() {
        super("A user associated with this email already exists");
    }
}

export class SignupUserException extends BadRequestException {
    constructor(message?: string) {
        super("An error Occurred while signing up the user", {
            description: message
        });
    }
}

export class LoginUserException extends BadRequestException {
    constructor(message?: string) {
        super("Invalid email or password", {
            description: message
        });
    }
}

export class InvalidUpdateUserException extends BadRequestException {
    constructor(message?: string) {
        super("An error Occurred while updating the user", {
            description: message
        });
    }
}

export class ResendConfirmationCodeException extends BadRequestException {
    constructor(message?: string) {
        super("An error Occurred while resending the confirmation code", {
            description: message
        });
    }
}

export class ConfirmForgotPasswordException extends BadRequestException {
    constructor(name: string, message?: string) {
        super(getConfirmPasswordExceptionGeneralErrorMessage(name), {
            description: message
        });
    }
}
