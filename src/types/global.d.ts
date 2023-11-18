interface EnvironmentalVariables {
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
    JWT_SECRET: string;
    ACCESS_TOKEN_EXPIRY: string;
    REFRESH_TOKEN_EXPIRY: string;
    MAIL_API_BASE_URL: string;
    MAIL_API_KEY: string;
    MAIL_API_SENDER_EMAIL: string;
    MAIL_API_SENDER_NAME: string;
    SENTRY_DSN: string;
    PASSWORD_SALT: string | number;
}

declare global {
    namespace NodeJS {
        interface ProcessEnv extends EnvironmentalVariables { }
    }
}

export { };
