import { Login } from "./login";
import { DEFAULT_EXPIRE_ADD, expire } from "./login";
import {
  GraphError,
  UnauthorizedError,
  CredentialError,
  warnConsole,
} from "../errors";
import type { Permissions } from "./login";
export class Page {
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
    token?: string,
    expires?: number,
    warn: boolean = this.facebook.warnExpired
  ): Promise<boolean> {
    if (token === undefined || expires === undefined) {
      this.valid = false;
      return false;
    }

    const appAccessToken = `${this.facebook.id}|${this.facebook.secret}`;

    try {
      const response = await this.facebook.client.get("debug_token", {
        input_token: token,
        access_token: appAccessToken,
      });
      const data: {
        is_valid: boolean;
        scopes: string[];
      } = response.data;

      const scope = this.facebook.scope;
      const required = Object.keys(scope).filter((key) => scope[key] === true);
      const check = (key: string) => data.scopes.includes(key);

      if (data.is_valid) {
        this.token = token;
        this.expires = expires;
        this.valid = true;
      } else {
        this.valid = false;
        return false;
      }

      if (required.every(check)) {
        this.token = token;
        this.expires = expires;
        this.valid = true;
      } else {
        this.valid = false;
        if (warn) {
          warnConsole(
            "Permission scope mismatch for page token. You are missing the following scopes: " +
              required.filter((r) => !check(r)).join(", ") +
              "Although you can ignore this warning, if you encounter any unauthorized errors, the app must be re-authorized in order to get the correct scopes." +
              "\nTo resolve the issue, add the missing scopes to your `credentials.json` file and re-authorize the app."
          );
        } else {
          throw new CredentialError(
            "Permission scope mismatch for page token. You are missing the following scopes: " +
              required.filter((r) => !check(r)).join(", ") +
              "\nThe app must be re-authorized in order to get the correct scopes. Although this error is caused by the page token not having the correct permissions, the page token inherits permissions from the user token." +
              "\nTo resolve the issue, add the missing scopes to your `credentials.json` file and re-authorize the app."
          );
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
      } else {
        const error = new Error();
        throw new UnauthorizedError(
          "Error verifying page token.",
          error,
          e as GraphError
        );
      }
    }
  }

  async generate(
    id: string | undefined = this.facebook.info.user.id,
    token: string | undefined = this.facebook.access.user.token
  ): Promise<string | undefined> {
    interface GenerateResponse {
      data: Array<{
        access_token: string;
        category: string;
        category_list: Array<{
          id: string;
          name: string;
        }>;
        name: string;
        id: string;
        tasks: Array<string>;
      }>;
      paging: {
        cursors: {
          before: string;
          after: string;
        };
      };
    }
    return this.facebook.client
      .get(`${id}/accounts`, {
        access_token: token,
      })
      .then((response: GenerateResponse) => {
        const data = response.data.at(0);

        if (data === undefined) {
          this.valid = false;
          return undefined;
        }

        if (data.access_token) {
          this.token = data.access_token;
          this.expires = expire();
          this.valid = true;

          this.facebook.writeCredentials({
            pageToken: this.token,
            pageTokenExpires: this.expires,
          });

          return this.token;
        } else {
          this.valid = false;
          return undefined;
        }
      })
      .catch((e: GraphError) => {
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
            "Error generating page token.",
            error,
            e as GraphError
          );
        }
      })
      .then((token: string | undefined) => {
        if (token === undefined) {
          this.valid = false;
          return undefined;
        }
        return this.facebook.client
          .get("oauth/access_token", {
            client_id: this.facebook.id,
            client_secret: this.facebook.secret,
            grant_type: "fb_exchange_token",
            fb_exchange_token: token,
          })
          .then((response: any) => {
            console.log(response);
          });
      });
  }

  async refresh(
    token: string | undefined = this.token,
    expires: number | undefined = this.expires,
    warn: boolean = this.facebook.warnExpired
  ): Promise<{ token: string | undefined; expires: number | undefined }> {
    if (token === undefined) {
      const error = new Error();
      throw new CredentialError("Page token is missing.", error);
    }

    if (expires === undefined) {
      if (warn) {
        warnConsole("Page token may be expired.");
        this.expires = expire();
      } else {
        const error = new Error();
        throw new CredentialError("Page token expiration is missing.", error);
      }
    }

    return this.validate(token, expires).then((valid) => {
      if (valid) {
        return {
          token,
          expires: this.expires,
        };
      } else {
        return this.generate(
          this.facebook.info.user.id,
          this.facebook.access.user.token
        ).then((token) => {
          if (token === undefined) {
            const error = new Error();
            throw new CredentialError("Error refreshing page token.", error);
          }
          return {
            token,
            expires: this.expires,
          };
        });
      }
    });
  }
}
