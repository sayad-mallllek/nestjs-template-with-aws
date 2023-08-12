import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { IsNotEmpty, Length, Matches, MinLength } from 'class-validator';
import { Request } from 'express';
import { CognitoUserType } from 'src/types/auth.types';

export const Protected = () => SetMetadata('protected', true);

export const AuthUser = createParamDecorator(
  (_data: never, ctx: ExecutionContext): CognitoUserType => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export const UserId = createParamDecorator(
  (_data: never, ctx: ExecutionContext): CognitoUserType => {
    const request = ctx.switchToHttp().getRequest();
    return request.userId;
  },
);

export const AccessToken = createParamDecorator(
  (_data: never, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const token = request.cookies['accessToken'];
    if (!token) {
      throw new UnauthorizedException();
    }
    return token.split('Bearer ')[1];
  },
);

export const IsPassword = () =>
  applyDecorators(
    IsNotEmpty(),
    MinLength(8),
    Matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*?()\-_,=+])(?=.{8,})/,
      {
        message: 'password is too weak',
      },
    ),
  );

export const IsCode = () =>
  applyDecorators(
    IsNotEmpty(),
    Length(6, 6, { message: 'code must be 6 characters long' }),
  );
