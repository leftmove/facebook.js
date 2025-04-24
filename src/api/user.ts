import { Login } from "./login";
import { DEFAULT_EXPIRE_ADD, expire } from "./login";
import {
  GraphError,
  UnauthorizedError,
  CredentialError,
  warnConsole,
} from "../errors";

export class User {
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

  async validate(
    token: string | undefined = this.token,
    expires: number | undefined = this.expires,
    bypass: boolean = false,
    warn: boolean = this.facebook.warnExpired
  ): Promise<boolean> {
    if (token === undefined) {
      this.valid = false;
      return false;
    }

    const appAccessToken = `${this.facebook.id}|${this.facebook.secret}`;
    const scope = this.facebook.scope;

    try {
      const response = await this.facebook.client.get("debug_token", {
        input_token: token,
        access_token: appAccessToken,
      });

      const data: {
        is_valid: boolean;
        scopes: string[];
      } = response.data;
      const required = Object.keys(scope).filter((key) => scope[key] === true);
      const check = (key: string) => data.scopes.includes(key);

      if (data.is_valid) {
        this.token = token;
        this.expires = expires;
        this.valid = true;
      } else {
        this.valid = false;
        if (bypass) {
          return false;
        } else {
          const error = new Error();
          throw new CredentialError(
            "User token is not valid. You must re-authorize the app.",
            error
          );
        }
      }

      if (required.every(check)) {
        this.token = token;
        this.expires = expires;
        this.valid = true;
      } else {
        this.valid = false;
        if (bypass) {
          return false;
        } else {
          if (warn) {
            warnConsole(
              "Permission scope mismatch for user token. You are missing the following scopes: " +
                required.filter((r) => !check(r)).join(", ") +
                "\nAlthough you can ignore this warning, if you encounter any unauthorized errors, the app must be re-authorized in order to get the correct scopes." +
                "\nTo resolve the issue, add the missing scopes to your `credentials.json` file and re-authorize the app."
            );
          } else {
            const error = new Error();
            throw new CredentialError(
              "Permission scope mismatch for user token. You are missing the following scopes: " +
                required.filter((r) => !check(r)).join(", ") +
                "\nAlthough you can ignore this warning, if you encounter any unauthorized errors, the app must be re-authorized in order to get the correct scopes." +
                "\nTo resolve the issue, add the missing scopes to your `credentials.json` file and re-authorize the app.",
              error
            );
          }
        }
      }

      return true;
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
      } else if (error instanceof CredentialError) {
        throw e;
      } else {
        const error = new Error();
        throw new UnauthorizedError(
          "Error verifying user token.",
          error,
          e as GraphError
        );
      }
    }
  }

  async generate(code: string, redirect: string): Promise<string | undefined> {
    try {
      const data = await this.facebook.client.get("oauth/access_token", {
        code,
        redirect_uri: redirect,
        client_id: this.facebook.id,
        client_secret: this.facebook.secret,
      });

      if (data.access_token) {
        this.token = data.access_token;
        this.expires = expire();
        this.valid = true;

        this.facebook.writeCredentials({
          userToken: this.token,
          userTokenExpires: this.expires,
        });

        return this.token;
      } else {
        this.valid = false;
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
          "Error generating user token.",
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
      throw new CredentialError("User token is missing.", error);
    }

    if (expires === undefined) {
      if (warn) {
        warnConsole("User token may be expired.");
        this.expires = expire();
      } else {
        const error = new Error();
        throw new CredentialError("User token expiration is missing.", error);
      }
    }

    return this.validate(token, expires).then((valid) => {
      if (valid) {
        return {
          token: token,
          expires: this.expires,
        };
      } else {
        const error = new Error();
        throw new CredentialError("User token is not valid.", error);
      }
    });
  }
}
