type Identity = {
  userId: string;
  providerName: string;
  providerType: string;
  primary: string;
  dateCreated: string;
};

export type CognitoUserType = {
  sub: string;
  iss: string;
  client_id: string;
  origin_jti: string;
  event_id: string;
  token_use: string;
  scope: string;
  auth_time: number;
  exp: number;
  iat: number;
  jti: string;
  username: string;
};

export type IdCognitoUser = Omit<CognitoUserType, 'username'> & {
  'cognito:username': string;
  email: string;
  email_verified: boolean;
  identities?: Identity[];
  family_name: string;
  given_name: string;
  phone_number?: string;
};

export type ExchangeTokenType = {
  id_token: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
};
