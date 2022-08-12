// Hanko

import { Hanko } from "./Hanko";

export { Hanko };

// Client

import {
  HttpClient,
  ConfigClient,
  UserClient,
  WebauthnClient,
  PasswordClient,
  PasscodeClient,
  Headers,
  Response,
} from "./lib/Client";

export {
  HttpClient,
  ConfigClient,
  UserClient,
  WebauthnClient,
  PasswordClient,
  PasscodeClient,
  Headers,
  Response,
};

// WebauthnSupport

import { WebauthnSupport } from "./lib/WebauthnSupport";

export { WebauthnSupport };

// DTO

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

// Errors

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
