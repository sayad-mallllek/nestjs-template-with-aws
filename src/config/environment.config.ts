import { boolean, number, object, string } from 'yup';

export const NODE_ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  STAGING: 'staging',
};

export const validationSchema = object<NodeJS.ProcessEnv>({
  DATABASE_URL: string().required(),
  NODE_ENV: string().oneOf(Object.values(NODE_ENV)).required(),
  PORT: number().required(),
  COGNITO_ACCESS_KEY_ID: string().required(),
  COGNITO_SECRET_ACCESS_KEY: string().required(),
  COGNITO_POOL_ID: string().required(),
  COGNITO_CLIENT_ID: string().required(),
  COGNITO_REGION: string().required(),
  COGNITO_KEYS: string().required(),
  COGNITO_DOMAIN: string().required(),
  SENTRY_DSN: string().optional(),
  URL_VERSION: number().optional(),
  RESPONSE_MAPPER: boolean().required(),
});
