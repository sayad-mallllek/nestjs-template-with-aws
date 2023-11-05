import { Injectable } from '@nestjs/common';

//TODO add to env
@Injectable()
export class JwtConfig {
  accessTokenSecret = process.env.JWT_SECRET;
  accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY;
  refreshTokenSecret = process.env.JWT_SECRET;
  refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY;
}
