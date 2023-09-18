import {
  ConfigGetOptions,
  ConfigService as NestConfigService,
  NoInferType,
  Path,
  PathValue,
} from '@nestjs/config';

interface EnvironmentalVariablesType {
  DATABASE_URL: string;
  NODE_ENV: string;
  PORT: number;
  COGNITO_ACCESS_KEY_ID: string;
  COGNITO_SECRET_ACCESS_KEY: string;
  COGNITO_POOL_ID: string;
  COGNITO_CLIENT_ID: string;
  COGNITO_REGION: string;
  COGNITO_KEYS: string;
  COGNITO_DOMAIN: string;
  ACCESS_TOKEN_SECRET: string;
  ACCESS_TOKEN_EXPIRY: string;
  REFRESH_TOKEN_SECRET: string;
  REFRESH_TOKEN_EXPIRY: string;
  MAIL_API_BASE_URL: string;
  MAIL_API_KEY: string;
  MAIL_API_SENDER_EMAIL: string;
  MAIL_API_SENDER_NAME: string;
}

declare global {
  namespace NodeJS {
    type ProcessEnv = {
      DATABASE_URL: string;
      NODE_ENV: string;
      PORT: number;
      COGNITO_ACCESS_KEY_ID: string;
      COGNITO_SECRET_ACCESS_KEY: string;
      COGNITO_POOL_ID: string;
      COGNITO_CLIENT_ID: string;
      COGNITO_REGION: string;
      COGNITO_KEYS: string;
      COGNITO_DOMAIN: string;
      ACCESS_TOKEN_SECRET: string;
      ACCESS_TOKEN_EXPIRY: string;
      REFRESH_TOKEN_SECRET: string;
      REFRESH_TOKEN_EXPIRY: string;
      MAIL_API_BASE_URL: string;
      MAIL_API_KEY: string;
      MAIL_API_SENDER_EMAIL: string;
      MAIL_API_SENDER_NAME: string;
    };
  }

  namespace Config {
    // type ConfigService = NestConfigService<NodeJS.ProcessEnv>;
    class ConfigService extends NestConfigService<NodeJS.ProcessEnv> {
      constructor(internalConfig?: Record<string, any>) {
        super(internalConfig);
      }

      get<T = string | number>(propertyPath: keyof NodeJS.ProcessEnv): T;
      get<T = NodeJS.ProcessEnv, P extends Path<T> = any, R = PathValue<T, P>>(
        propertyPath: P,
        options: ConfigGetOptions,
      ): R;
      get<T = string | number>(
        propertyPath: keyof NodeJS.ProcessEnv,
        defaultValue: NoInferType<T>,
      ): T;
      get<T = NodeJS.ProcessEnv, P extends Path<T> = any, R = PathValue<T, P>>(
        propertyPath: P,
        defaultValue: NoInferType<R>,
        options: ConfigGetOptions,
      ): Exclude<R, undefined>;
    }
  }
}

export {};
