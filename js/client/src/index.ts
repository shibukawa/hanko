import { Client } from "./Client";

import {
  PasswordConfig,
  Config,
  WebauthnFinalized,
  Credential,
  UserInfo,
  Me,
  User,
  Passcode,
  Attestation,
} from "./lib/DTO";

import {
  HankoError,
  TechnicalError,
  ConflictError,
  RequestTimeoutError,
  WebAuthnRequestCancelledError,
  InvalidPasswordError,
  InvalidPasscodeError,
  InvalidWebauthnCredentialError,
  PasscodeExpiredError,
  MaxNumOfPasscodeAttemptsReachedError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
} from "./lib/Errors";

export { Client };

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

export {
  HankoError,
  TechnicalError,
  ConflictError,
  RequestTimeoutError,
  WebAuthnRequestCancelledError,
  InvalidPasswordError,
  InvalidPasscodeError,
  InvalidWebauthnCredentialError,
  PasscodeExpiredError,
  MaxNumOfPasscodeAttemptsReachedError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
};
