import { Login } from "./login";
import { DEFAULT_EXPIRE_ADD } from "./login";
import {
  GraphError,
  UnauthorizedError,
  CredentialError,
  warnConsole,
} from "../errors";

export class App {
  facebook: Login;
  token: string | undefined;
  expires: number | undefined;
  valid: boolean;

  constructor(facebook: Login) {
    this.facebook = facebook;
    this.token = undefined;
    this.expires = undefined;
    this.valid = false;
  }

  async validate(token?: string, expires?: number): Promise<boolean> {
    if (token === undefined || expires === undefined) {
      this.valid = false;
      return false;
    }

    const appAccessToken = `${this.facebook.id}|${this.facebook.secret}`;

    try {
      const data = await this.facebook.client.get("debug_token", {
        input_token: token,
        access_token: appAccessToken,
      });

      if (data.data.is_valid) {
        this.token = token;
        this.expires = expires;
        this.valid = true;
        return true;
      } else {
        this.valid = false;
        return false;
      }
    } catch (e) {
      const error = e as GraphError;
      const data = error.data as {
        error: { code: number; message: string };
        is_valid: boolean;
        scopes: any[];
      };
      const code = data?.error?.code || 400;
      if (code === 190) {
        this.valid = false;
        return false;
      } else {
        const error = new Error();
        throw new UnauthorizedError(
          "Error verifying app token.",
          error,
          e as GraphError
        );
      }
    }
  }

  async generate(): Promise<string | undefined> {
    const appAccessToken = `${this.facebook.id}|${this.facebook.secret}`;
    try {
      const data = await this.facebook.client.get("debug_token", {
        input_token: appAccessToken,
        access_token: appAccessToken,
      });

      if (data.data.is_valid) {
        this.token = appAccessToken;
        this.expires = Date.now() / 1000 + DEFAULT_EXPIRE_ADD;
        this.valid = true;

        this.facebook.writeCredentials({
          appToken: this.token,
          appTokenExpires: this.expires,
        });

        return this.token;
      } else {
        this.valid = false;
        this.expires = Date.now() / 1000;
        return undefined;
      }
    } catch (e) {
      const error = e as GraphError;
      const data = error.data as {
        error: { code: number; message: string };
        is_valid: boolean;
        scopes: any[];
      };
      const code = data?.error?.code || 400;
      if (code === 190) {
        this.valid = false;
        return undefined;
      } else {
        const error = new Error();
        throw new UnauthorizedError(
          "Error verifying app token.",
          error,
          e as GraphError
        );
      }
    }
  }

  async refresh(
    token: string | undefined = this.token,
    expires: number | undefined = this.expires,
    warn: boolean = this.facebook.warnExpired
  ): Promise<{ token: string | undefined; expires: number | undefined }> {
    if (token === undefined) {
      const error = new Error();
      throw new CredentialError("App token is missing.", error);
    }

    if (expires === undefined) {
      if (warn) {
        warnConsole("App token may be expired.");
        this.expires = Date.now() / 1000 + DEFAULT_EXPIRE_ADD;
      } else {
        const error = new Error();
        throw new CredentialError("App token expiration is missing.", error);
      }
    }

    return this.validate(token, expires).then((valid) => {
      if (valid) {
        return {
          token: token,
          expires: this.expires,
        };
      } else {
        return this.generate().then((token) => {
          if (token === undefined) {
            const error = new Error();
            throw new CredentialError("Error refreshing app token.", error);
          } else {
            return {
              token,
              expires: this.expires,
            };
          }
        });
      }
    });
  }
}
