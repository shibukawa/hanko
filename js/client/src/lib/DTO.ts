import { PublicKeyCredentialWithAttestationJSON } from "@github/webauthn-json";

interface PasswordConfig {
  enabled: boolean;
}

interface Config {
  password: PasswordConfig;
}

interface WebauthnFinalized {
  credential_id: string;
  user_id: string;
}

interface Credential {
  id: string;
}

interface UserInfo {
  id: string;
  verified: boolean;
  has_webauthn_credential: boolean;
}

interface Me {
  id: string;
}

interface User {
  id: string;
  email: string;
  webauthn_credentials: Credential[];
}

interface Passcode {
  id: string;
  ttl: number;
}

interface Attestation extends PublicKeyCredentialWithAttestationJSON {
  transports: string[];
}

export type {
  PasswordConfig,
  Config,
  WebauthnFinalized,
  Credential,
  UserInfo,
  Me,
  User,
  Passcode,
  Attestation,
};
