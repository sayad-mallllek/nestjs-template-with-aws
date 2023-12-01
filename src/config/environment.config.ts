import { boolean, number, object, string } from 'yup';

export const NODE_ENV = {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    STAGING: 'staging',
};


/*
    DATABASE_URL: string;
    NODE_ENV: 'development' | 'production' | 'staging';
    PORT: number;
    COGNITO_ACCESS_KEY_ID: string;
    COGNITO_SECRET_ACCESS_KEY: string;
    COGNITO_POOL_ID: string;
    COGNITO_CLIENT_ID: string;
    COGNITO_REGION: string;
    COGNITO_KEYS: string;
    COGNITO_DOMAIN: string;
    SENTRY_DSN: string;
*/

export const validationSchema = object<NodeJS.ProcessEnv>({
    DATABASE_URL: string().required(),
    NODE_ENV: string().oneOf(Object.values(NODE_ENV)).required(),
    PORT: number().required(),
    JWT_SECRET: string().required(),
    REFRESH_TOKEN_EXPIRY: string().required(),
    MAIL_API_BASE_URL: string().url().optional(),
    MAIL_API_KEY: string().optional(),
    MAIL_API_SENDER_EMAIL: string().email().optional(),
    MAIL_API_SENDER_NAME: string().optional(),
    SENTRY_DSN: string().optional(),
    URL_VERSION: number().optional(),
    PASSWORD_SALT: string().optional(),
    RESPONSE_MAPPER: boolean().required(),
});
