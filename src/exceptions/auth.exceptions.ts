import { BadRequestException, HttpException } from '@nestjs/common';

import {
  getConfirmPasswordExceptionGeneralErrorMessage,
  getSetupMFAExceptionGeneralErrorMessage,
} from '@/utils/functions/auth.functions';

export class DuplicateEmailException extends BadRequestException {
  constructor() {
    super('A user associated with this email already exists');
  }
}

export class SignupUserException extends BadRequestException {
  constructor(description?: string) {
    super('An error Occurred while signing up the user', {
      description,
    });
  }
}

export class LoginUserException extends BadRequestException {
  constructor(description?: string) {
    super('Invalid email or password', {
      description,
    });
  }
}
export class SetupMFAException extends HttpException {
  constructor(name: string, description?: string) {
    const { code, message } = getSetupMFAExceptionGeneralErrorMessage(name);
    super(message, code, {
      description,
    });
  }
}

export class ConfirmLoginUserException extends HttpException {
  constructor(name: string, description?: string) {
    const { code, message } = getSetupMFAExceptionGeneralErrorMessage(name);
    super(message, code, {
      description,
    });
  }
}
export class InvalidUpdateUserException extends BadRequestException {
  constructor(description?: string) {
    super('An error Occurred while updating the user', {
      description,
    });
  }
}

export class ResendConfirmationCodeException extends BadRequestException {
  constructor(description?: string) {
    super('An error Occurred while resending the confirmation code', {
      description,
    });
  }
}

export class ConfirmForgotPasswordException extends BadRequestException {
  constructor(name: string, message?: string) {
    super(getConfirmPasswordExceptionGeneralErrorMessage(name), {
      description: message,
    });
  }
}
