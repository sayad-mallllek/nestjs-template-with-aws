import { atob } from 'atob';

import * as jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';

import jwkToPemFunction from 'jwk-to-pem';

import * as bcrypt from 'bcrypt';

const DEFAULT_SALT = 10;

export function awsJwkToPem(kid: string) {
  const keys = JSON.parse(process.env.COGNITO_KEYS) as (jwkToPem.JWK & {
    kid: string;
  })[];
  const jwk = keys.filter((obj) => obj.kid === kid)[0];
  console.log(keys, kid);
  return jwkToPemFunction(jwk);
}

export function getUserFromToken(token: string) {
  const header = JSON.parse(atob(token.split('.')[0]));
  console.log(header);
  const pem = awsJwkToPem(header['kid']);
  return jwt.verify(token, pem, { algorithms: ['RS256'] });
}

export function extractToken(token?: string) {
  if (token) return token.match(/Bearer (?<token>.*)/)?.groups?.token;
  return null;
}

export const getConfirmPasswordExceptionGeneralErrorMessage = (
  name: string,
) => {
  switch (name) {
    case 'ExpiredCodeException':
      return 'Invalid Code Received';
    case 'CodeMismatchException':
      return 'Invalid Code Received';
    case 'LimitExceededException':
      return 'Too many attempts, Please try again later';
    default:
      return 'Something went wrong, please try again later';
  }
};

export const hashPass = async (password: string, salt?: number | string) => {
  return bcrypt.hash(password, salt || DEFAULT_SALT);
};

export const isPassMatch = async (password: string, hashedPassword: string) => {
  return bcrypt.compare(password, hashedPassword);
};
