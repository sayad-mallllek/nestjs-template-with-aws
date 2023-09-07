import { Injectable } from '@nestjs/common';

//TODO add to env
@Injectable()
export class JwtConfig {
    accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
    accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY;
    refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
    refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY;
}
