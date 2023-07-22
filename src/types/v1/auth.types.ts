export interface CognitoUserType {
    sub: string;
    email: string;
    email_verified: boolean;
    iss: string;
    origin_jti: string;
    aud: string;
    event_id: string;
    token_use: string;
    auth_time: number;
    exp: number;
    iat: number;
    jti: string;
}
