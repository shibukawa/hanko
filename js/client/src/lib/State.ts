import { Credential } from "./DTO";

interface Passcode {
  id: string;
  ttl: number;
  resendAfter: number;
}

interface Password {
  retryAfter: number;
}

interface User {
  webAuthnCredentials: string[];
  passcode: Passcode;
  password: Password;
}

interface Users {
  [userID: string]: User;
}

interface Store {
  users?: Users;
}

const initialUserState: User = {
  webAuthnCredentials: [],
  passcode: { id: "", ttl: 0, resendAfter: 0 },
  password: { retryAfter: 0 },
};

abstract class State {
  key: string;

  public constructor(key: string = "hanko") {
    this.key = key;
  }

  read(): Store {
    let store: Store;
    try {
      const data = localStorage.getItem(this.key);
      const decoded = decodeURIComponent(decodeURI(window.atob(data)));

      store = JSON.parse(decoded);
    } catch (_) {
      return { users: {} } as Store;
    }

    return store;
  }

  write(store: Store): void {
    const data = JSON.stringify(store);
    const encoded = window.btoa(encodeURI(encodeURIComponent(data)));

    localStorage.setItem(this.key, encoded);
  }

  getUserState(userID: string) {
    const store = this.read();
    const exists = Object.prototype.hasOwnProperty.call(store.users, userID);

    return exists ? store.users[userID] : initialUserState;
  }

  setUserState(userID: string, state: User) {
    const store = this.read();

    store.users[userID] = state;
    this.write(store);
  }

  timeToRemainingSeconds(time: number = 0) {
    return time - Math.floor(Date.now() / 1000);
  }

  remainingSecondsToTime(seconds: number = 0) {
    return Math.floor(Date.now() / 1000) + seconds;
  }
}

class WebAuthnState extends State {
  setCredentialID(userID: string, credentialID: string): void {
    const state = super.getUserState(userID);

    state.webAuthnCredentials.push(credentialID);
    this.setUserState(userID, state);
  }

  matchCredentials(userID: string, match: Credential[]): Credential[] {
    const { webAuthnCredentials } = super.getUserState(userID);
    return webAuthnCredentials
      .filter((id) => match.find((c) => c.id === id))
      .map((id: string) => ({ id } as Credential));
  }
}

class PasscodeState extends State {
  getActiveID(userID: string): string {
    const { passcode } = this.getUserState(userID);

    return passcode.id;
  }

  setActiveID(userID: string, passcodeID: string) {
    const state = this.getUserState(userID);

    state.passcode.id = passcodeID;
    this.setUserState(userID, state);
  }

  removeActive(userID: string) {
    const state = this.getUserState(userID);

    state.passcode.id = initialUserState.passcode.id;
    state.passcode.ttl = initialUserState.passcode.ttl;
    this.setUserState(userID, state);
  }

  getTTL(userID: string): number {
    const state = this.getUserState(userID);

    return this.timeToRemainingSeconds(state.passcode.ttl);
  }

  setTTL(userID: string, seconds: number): void {
    const state = this.getUserState(userID);

    state.passcode.ttl = this.remainingSecondsToTime(seconds);
    this.setUserState(userID, state);
  }

  getResendAfter(userID: string): number {
    const { passcode } = this.getUserState(userID);

    return this.timeToRemainingSeconds(passcode.resendAfter);
  }

  setResendAfter(userID: string, seconds: number): void {
    const state = this.getUserState(userID);

    state.passcode.resendAfter = this.remainingSecondsToTime(seconds);
    this.setUserState(userID, state);
  }
}

class PasswordState extends State {
  getRetryAfter(userID: string): number {
    const state = this.getUserState(userID);

    return this.timeToRemainingSeconds(state.password.retryAfter);
  }

  setRetryAfter(userID: string, seconds: number): void {
    const state = this.getUserState(userID);

    state.password.retryAfter = this.remainingSecondsToTime(seconds);
    this.setUserState(userID, state);
  }
}

export { WebAuthnState, PasscodeState, PasswordState };
