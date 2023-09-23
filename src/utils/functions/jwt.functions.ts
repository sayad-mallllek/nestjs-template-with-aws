import { BadRequestException } from '@nestjs/common';
import { sign, verify } from 'jsonwebtoken';

import { JwtConfig } from '@/config/jwt.config';

const jwtConfig = new JwtConfig();

export const signAccessToken = (id: string) => {
  return sign({ id }, jwtConfig.accessTokenSecret, {
    expiresIn: jwtConfig.accessTokenExpiry,
  });
};

export const signRefreshToken = (id: string) => {
  return sign({ id }, jwtConfig.refreshTokenSecret, {
    expiresIn: jwtConfig.refreshTokenExpiry,
  });
};

const verifyToken = (token: string, secret: string) => {
  try {
    return verify(token, secret);
  } catch {
    throw new BadRequestException('Token is not valid');
  }
};

export const verifyAccessToken = (token: string) => {
  return verifyToken(token, jwtConfig.accessTokenSecret);
};

export const verifyRefreshToken = (token: string) => {
  return verifyToken(token, jwtConfig.refreshTokenSecret);
};
