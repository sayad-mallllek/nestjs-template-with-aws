import atob from 'atob';
import { Response } from 'express';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import { CognitoUserType } from 'src/types/v1/auth.types';

export const awsJwkToPem = (kid: string) => {
  const keys: (jwkToPem.JWK & { kid: string })[] = JSON.parse(
    process.env.COGNITO_KEYS,
  );
  const jwk = keys.filter((obj) => obj.kid === kid)[0];
  return jwkToPem(jwk);
};

export const getUserFromIdToken = (token: string) => {
  const header = JSON.parse(atob(token.split('.')[0]));
  const pem = awsJwkToPem(header['kid']);
  return jwt.verify(token, pem, { algorithms: ['RS256'] }) as CognitoUserType;
};

export const setTokensToCookie = (
  accessToken: string,
  idToken: string,
  refreshToken: string,
  res: Response,
) => {
  const maxAgeAccessToken = 1000 * 60 * 60 * 24 * 30; // 30 days
  const maxAgeIdToken = 1000 * 60 * 60 * 24 * 30; // 30 days
  const maxAgeRefreshToken = 1000 * 60 * 60 * 24 * 30; // 30 days

  res.cookie('accessToken', `Bearer ${accessToken}`, {
    httpOnly: true,
    maxAge: maxAgeAccessToken,
  });

  res.cookie('idToken', `Bearer ${idToken}`, {
    httpOnly: true,
    maxAge: maxAgeIdToken,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    maxAge: maxAgeRefreshToken,
  });
};

export const clearTokensFromCookie = (res: Response) => {
  res.clearCookie('accessToken');
  res.clearCookie('idToken');
  res.clearCookie('refreshToken');
};
