export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

export const IS_STAGING = process.env.NODE_ENV === 'staging';

export const IS_DEPLOYED = IS_PRODUCTION || IS_STAGING;
