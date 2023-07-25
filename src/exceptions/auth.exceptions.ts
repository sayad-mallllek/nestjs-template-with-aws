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

export class InvalidUpdateUserException extends BadRequestException {
    constructor(message?: string) {
        super("An error Occurred while updating the user", {
            description: message
        });
    }
}
