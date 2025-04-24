import { Login } from "./login";
import { DEFAULT_EXPIRE_ADD, expire } from "./login";
import {
  GraphError,
  UnauthorizedError,
  CredentialError,
  warnConsole,
} from "../errors";

import type { Debug } from "./login";

export class Pid {
  private facebook: Login;
  id: string | undefined;
  expires: number | undefined;
  valid: boolean;

  constructor(facebook: Login) {
    this.facebook = facebook;
    this.id = undefined;
    this.expires = undefined;
    this.valid = false;
  }

  async validate(
    id?: string,
    expires?: number,
    token?: string
  ): Promise<boolean> {
    if (id === undefined || expires === undefined || token === undefined) {
      this.valid = false;
      return false;
    }

    try {
      const response: Debug = await this.facebook.client.get("debug_token", {
        input_token: token,
        access_token: token,
      });
      const data = response.data;

      const scope = this.facebook.scope;
      const required = Object.keys(scope).filter((key) => scope[key] === true);
      const check = (key: string) => data.scopes.includes(key);

      if (data.is_valid) {
        this.id = id;
        this.expires = expires;
        this.valid = true;
      } else {
        this.valid = false;
        return false;
      }

      if (required.every(check)) {
        this.id = id;
        this.expires = expires;
        this.valid = true;
      } else {
        this.valid = false;
        return false;
      }

      return true;
    } catch (e) {
      const error = e as GraphError;
      const data = error.data as {
        error: { code: number; message: string };
      };
      const code = data?.error?.code || 400;
      if (code === 190) {
        this.valid = false;
        return false;
      } else {
        const error = new Error();
        throw new UnauthorizedError(
          "Error verifying page ID.",
          error,
          e as GraphError
        );
      }
    }
  }

  async generate(
    index: number = this.facebook.info.index
  ): Promise<string | undefined> {
    if (this.facebook.access.user.token === undefined) {
      const error = new Error();
      throw new CredentialError("User token is required.", error);
    }

    try {
      const data = await this.facebook.client.get("me/accounts", {
        access_token: this.facebook.access.user.token,
      });

      if (data.data && data.data.length > 0) {
        const page = data.data[index];
        if (page) {
          this.id = page.id;
          this.expires = expire();
          this.valid = true;

          this.facebook.writeCredentials({
            pageId: this.id,
            pageIdExpires: this.expires,
          });

          return this.id;
        }
      } else {
        this.valid = false;
        return undefined;
      }
    } catch (e) {
      const error = e as GraphError;
      const data = error.data as {
        error: { code: number; message: string };
      };
      const code = data?.error?.code || 400;
      if (code === 190) {
        this.valid = false;
        return undefined;
      } else {
        const error = new Error();
        throw new UnauthorizedError(
          "Error generating page ID.",
          error,
          e as GraphError
        );
      }
    }
  }

  async refresh(
    id: string | undefined = this.id,
    expires: number | undefined = this.expires,
    token: string | undefined = this.facebook.access.user.token,
    warn: boolean = this.facebook.warnExpired
  ): Promise<{ id: string | undefined; expires: number | undefined }> {
    if (id === undefined || token === undefined) {
      throw new CredentialError("Page ID is missing.");
    }

    if (expires === undefined) {
      if (warn) {
        warnConsole("Page ID may be expired.");
        this.expires = Date.now() / 1000 + DEFAULT_EXPIRE_ADD;
      } else {
        const error = new Error();
        throw new CredentialError("Page ID expiration is missing.", error);
      }
    }

    return this.validate(id, expires, token).then((valid) => {
      if (valid) {
        return {
          id: id,
          expires: this.expires,
        };
      } else {
        return this.generate().then((id) => {
          if (id === undefined) {
            const error = new Error();
            throw new CredentialError("Error refreshing page ID.", error);
          }
          return { id: id, expires: this.expires };
        });
      }
    });
  }
}
