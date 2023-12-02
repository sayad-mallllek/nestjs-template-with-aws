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
  SENTRY_DSN: string;
  URL_VERSION: string;
  RESPONSE_MAPPER: boolean;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvironmentalVariables {}
  }
}

export {};
