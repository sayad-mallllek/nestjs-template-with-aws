import { object, string, number, date, InferType } from 'yup';

export const NODE_ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
};

export const envValidationSchema = object<NodeJS.ProcessEnv>({
  NODE_ENV: string().oneOf(Object.values(NODE_ENV)).required(),
  PORT: number().required(),
  DATABASE_URL: string().required(),
  ACCESS_TOKEN_SECRET: string().required(),
  ACCESS_TOKEN_EXPIRY: string().required(),
  REFRESH_TOKEN_SECRET: string().required(),
  REFRESH_TOKEN_EXPIRY: string().required(),
  MAIL_API_BASE_URL: string().url().optional(),
  MAIL_API_KEY: string().optional(),
  MAIL_API_SENDER_EMAIL: string().email().optional(),
  MAIL_API_SENDER_NAME: string().optional(),
});