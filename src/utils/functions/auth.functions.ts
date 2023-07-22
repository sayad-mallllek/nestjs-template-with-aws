import { atob } from 'atob';
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const jwt = require('jsonwebtoken');
import * as jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jwkToPemFunction = require('jwk-to-pem');

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
