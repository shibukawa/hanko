import Cookies from "js-cookie";

import {
  get as getWebauthnCredential,
  create as createWebauthnCredential,
  CredentialRequestOptionsJSON,
  PublicKeyCredentialWithAssertionJSON,
  CredentialCreationOptionsJSON,
} from "@github/webauthn-json";

import { PasscodeState, PasswordState, WebAuthnState } from "./lib/State";

import {
  Config,
  UserInfo,
  User,
  Me,
  Passcode,
  Attestation,
  WebauthnFinalized,
} from "./lib/DTO";

import { isUserVerifyingPlatformAuthenticatorAvailable } from "./lib/Support";

import {
  InvalidPasswordError,
  WebAuthnRequestCancelledError,
  NotFoundError,
  TooManyRequestsError,
  TechnicalError,
  MaxNumOfPasscodeAttemptsReachedError,
  InvalidPasscodeError,
  UnauthorizedError,
  InvalidWebauthnCredentialError,
  RequestTimeoutError,
  ConflictError,
} from "./lib/Errors";

class Client {
  /**
   *  @public
   *  @type {ConfigClient}
   */
  config: ConfigClient;
  /**
   *  @public
   *  @type {UserClient}
   */
  user: UserClient;
  /**
   *  @public
   *  @type {WebauthnClient}
   */
  authenticator: WebauthnClient;
  /**
   *  @public
   *  @type {PasswordClient}
   */
  password: PasswordClient;
  /**
   *  @public
   *  @type {PasscodeClient}
   */
  passcode: PasscodeClient;

  /**
   * @constructor
   * @param {string} api - The URL of your Hanko API instance
   * @param {number=} timeout - The request timeout in milliseconds
   */
  constructor(api: string, timeout: number = 13000) {
    this.config = new ConfigClient(api, timeout);
    this.user = new UserClient(api, timeout);
    this.authenticator = new WebauthnClient(api, timeout);
    this.password = new PasswordClient(api, timeout);
    this.passcode = new PasscodeClient(api, timeout);
  }
}

class Headers2 {
  _xhr: XMLHttpRequest;

  constructor(xhr: XMLHttpRequest) {
    this._xhr = xhr;
  }

  get(name: string) {
    return this._xhr.getResponseHeader(name);
  }
}

class Response2 {
  headers: Headers2;
  ok: boolean;
  status: number;
  statusText: string;
  url: string;
  decodedJSON: any;

  constructor(xhr: XMLHttpRequest) {
    this.headers = new Headers2(xhr);
    this.ok = xhr.status >= 200 && xhr.status <= 299;
    this.status = xhr.status;
    this.statusText = xhr.statusText;
    this.url = xhr.responseURL;
    this.decodedJSON = JSON.parse(xhr.response);
  }

  json() {
    return this.decodedJSON;
  }
}

class HttpClient {
  timeout: number;
  api: string;

  constructor(api: string, timeout: number = 13000) {
    this.api = api;
    this.timeout = timeout;
  }

  _fetch(path: string, options: RequestInit) {
    const api = this.api;
    const url = api + path;
    const timeout = this.timeout;
    const cookieName = "hanko";
    const bearerToken = Cookies.get(cookieName);

    return new Promise<Response2>(function (resolve, reject) {
      const xhr = new XMLHttpRequest();

      xhr.open(options.method, url, true);
      xhr.setRequestHeader("Accept", "application/json");
      xhr.setRequestHeader("Content-Type", "application/json");

      if (bearerToken) {
        xhr.setRequestHeader("Authorization", `Bearer ${bearerToken}`);
      }

      xhr.timeout = timeout;
      xhr.withCredentials = true;
      xhr.onload = () => {
        const authToken = xhr.getResponseHeader("X-Auth-Token");

        if (authToken) {
          const secure = !!api.match("^https://");
          Cookies.set(cookieName, authToken, { secure });
        }

        resolve(new Response2(xhr));
      };
      xhr.onerror = () => {
        reject(new TechnicalError());
      };
      xhr.ontimeout = () => {
        reject(new RequestTimeoutError());
      };
      xhr.send(options.body?.toString());
    });
  }

  get(path: string) {
    return this._fetch(path, { method: "GET" });
  }

  post(path: string, body?: any) {
    return this._fetch(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  put(path: string, body?: any) {
    return this._fetch(path, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }
}

abstract class AbstractClient {
  client: HttpClient;

  constructor(api: string, timeout: number) {
    this.client = new HttpClient(api, timeout);
  }
}

/**
 * @constructor
 * @extends {AbstractClient}
 */
class ConfigClient extends AbstractClient {
  /**
   * Get the frontend configuration from the API
   * @return {Promise<Config>}
   * @throws {TechnicalError}
   */
  get() {
    return new Promise<Config>((resolve, reject) => {
      this.client
        .get("/.well-known/config")
        .then((response) => {
          if (response.ok) {
            return resolve(response.json());
          }

          throw new TechnicalError();
        })
        .catch((e) => {
          reject(e);
        });
    });
  }
}

class UserClient extends AbstractClient {
  getInfo(email: string): Promise<UserInfo> {
    return new Promise<UserInfo>((resolve, reject) => {
      this.client
        .post("/user", { email })
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else if (response.status === 404) {
            throw new NotFoundError();
          } else {
            throw new TechnicalError();
          }
        })
        .then((u: UserInfo) => resolve(u))
        .catch((e) => {
          reject(e);
        });
    });
  }

  create(email: string): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      this.client
        .post("/users", { email })
        .then((response) => {
          if (response.ok) {
            return resolve(response.json());
          } else if (response.status === 409) {
            throw new ConflictError();
          } else {
            throw new TechnicalError();
          }
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  getCurrent(): Promise<User> {
    return new Promise<User>((resolve, reject) =>
      this.client
        .get("/me")
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else if (
            response.status === 400 ||
            response.status === 401 ||
            response.status === 404
          ) {
            throw new UnauthorizedError();
          } else {
            throw new TechnicalError();
          }
        })
        .then((me: Me) => {
          return this.client.get(`/users/${me.id}`);
        })
        .then((response) => {
          if (response.ok) {
            return resolve(response.json());
          } else if (
            response.status === 400 ||
            response.status === 401 ||
            response.status === 404
          ) {
            throw new UnauthorizedError();
          } else {
            throw new TechnicalError();
          }
        })
        .catch((e) => {
          reject(e);
        })
    );
  }
}

class WebauthnClient extends AbstractClient {
  state: WebAuthnState;

  constructor(api: string, timeout: number) {
    super(api, timeout);
    this.state = new WebAuthnState();
  }

  login(userID?: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.client
        .post("/webauthn/login/initialize", { user_id: userID })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }

          throw new TechnicalError();
        })
        .catch((e) => {
          reject(e);
        })
        .then((challenge: CredentialRequestOptionsJSON) => {
          return getWebauthnCredential(challenge);
        })
        .catch((e) => {
          throw new WebAuthnRequestCancelledError(e);
        })
        .then((assertion: PublicKeyCredentialWithAssertionJSON) => {
          return this.client.post("/webauthn/login/finalize", assertion);
        })
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else if (response.status === 400 || response.status === 401) {
            throw new InvalidWebauthnCredentialError();
          } else {
            throw new TechnicalError();
          }
        })
        .then((w: WebauthnFinalized) => {
          this.state.setCredentialID(w.user_id, w.credential_id);
          return resolve();
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  register(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client
        .post("/webauthn/registration/initialize")
        .then((response) => {
          if (response.ok) {
            return response.json();
          }

          throw new TechnicalError();
        })
        .then((challenge: CredentialCreationOptionsJSON) => {
          return createWebauthnCredential(challenge);
        })
        .catch((e) => {
          throw new WebAuthnRequestCancelledError(e);
        })
        .then((attestation: Attestation) => {
          // The generated PublicKeyCredentialWithAttestationJSON object does not align with the API. The list of
          // supported transports must be available under a different path.
          attestation.transports = attestation.response.transports;

          return this.client.post(
            "/webauthn/registration/finalize",
            attestation
          );
        })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }

          throw new TechnicalError();
        })
        .then((w: WebauthnFinalized) => {
          this.state.setCredentialID(w.user_id, w.credential_id);
          return resolve();
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  isAuthenticatorSupported() {
    return isUserVerifyingPlatformAuthenticatorAvailable();
  }

  shouldRegister(user: User): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.isAuthenticatorSupported()
        .then((supported) => {
          if (!user.webauthn_credentials || !user.webauthn_credentials.length) {
            return resolve(supported);
          }

          const matches = this.state.matchCredentials(
            user.id,
            user.webauthn_credentials
          );

          return resolve(supported && !matches.length);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }
}

class PasswordClient extends AbstractClient {
  state: PasswordState;

  constructor(api: string, timeout: number) {
    super(api, timeout);
    this.state = new PasswordState();
  }

  login(userID: string, password: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.client
        .post("/password/login", { user_id: userID, password })
        .then((response) => {
          if (response.ok) {
            return resolve();
          } else if (response.status === 401) {
            throw new InvalidPasswordError();
          } else if (response.status === 429) {
            const retryAfter = parseInt(
              response.headers.get("X-Retry-After") || "0",
              10
            );

            this.state.setRetryAfter(userID, retryAfter);

            throw new TooManyRequestsError(retryAfter);
          } else {
            throw new TechnicalError();
          }
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  update(userID: string, password: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.client
        .put("/password", { user_id: userID, password })
        .then((response) => {
          if (response.ok) {
            return resolve();
          }

          throw new TechnicalError();
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  getRetryAfter(userID: string) {
    return this.state.getRetryAfter(userID);
  }
}

class PasscodeClient extends AbstractClient {
  state: PasscodeState;

  constructor(api: string, timeout: number) {
    super(api, timeout);
    this.state = new PasscodeState();
  }

  initialize(userID: string): Promise<Passcode> {
    return new Promise<Passcode>((resolve, reject) => {
      this.client
        .post("/passcode/login/initialize", { user_id: userID })
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else if (response.status === 429) {
            const retryAfter = parseInt(
              response.headers.get("X-Retry-After") || "0",
              10
            );

            this.state.setResendAfter(userID, retryAfter);

            throw new TooManyRequestsError(retryAfter);
          } else {
            throw new TechnicalError();
          }
        })
        .then((passcode: Passcode) => {
          const ttl = passcode.ttl;

          this.state.setActiveID(userID, passcode.id);
          this.state.setTTL(userID, ttl);

          return resolve(passcode);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  finalize(userID: string, code: string): Promise<void> {
    const passcodeID = this.state.getActiveID(userID);

    return new Promise<void>((resolve, reject) => {
      this.client
        .post("/passcode/login/finalize", { id: passcodeID, code })
        .then((response) => {
          if (response.ok) {
            this.state.removeActive(userID);
            this.state.setResendAfter(userID, 0);

            return resolve();
          } else if (response.status === 401) {
            throw new InvalidPasscodeError();
          } else if (response.status === 404 || response.status === 410) {
            this.state.removeActive(userID);

            throw new MaxNumOfPasscodeAttemptsReachedError();
          } else {
            throw new TechnicalError();
          }
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  getTTL(userID: string) {
    return this.state.getTTL(userID);
  }

  getResendAfter(userID: string) {
    return this.state.getResendAfter(userID);
  }
}

export { Client };
