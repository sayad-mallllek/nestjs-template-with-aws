import { atob } from 'atob';
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const jwt = require('jsonwebtoken');
import * as jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jwkToPemFunction = require('jwk-to-pem');

import * as bcrypt from 'bcrypt';

export function awsJwkToPem(kid: string) {
  const keys = JSON.parse(process.env.COGNITO_KEYS) as (jwkToPem.JWK & {
    kid: string;
  })[];
  const jwk = keys.filter((obj) => obj.kid === kid)[0];
  return jwkToPemFunction(jwk);
}

export function getUserFromToken(token: string) {
  const header = JSON.parse(atob(token.split('.')[0]));
  const pem = awsJwkToPem(header['kid']);
  return jwt.verify(token, pem, { algorithms: ['RS256'] });
}

export function extractToken(bearer?: string) {
  if (bearer) return bearer.match(/Bearer (?<token>.*)/)?.groups?.token;
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

export const hashPass = async (password: string) => {
  const salt = 10;
  return bcrypt.hash(password, salt);
};

export const isPassMatch = async (password: string, hashedPassword: string) => {
  return bcrypt.compare(password, hashedPassword);
};
