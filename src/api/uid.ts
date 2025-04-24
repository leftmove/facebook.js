import { Login } from "./login";
import { expire } from "./login";
import {
  GraphError,
  UnauthorizedError,
  CredentialError,
  warnConsole,
} from "../errors";

export class Uid {
  facebook: Login;
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
      const data = await this.facebook.client.get(`${id}`, {
        access_token: token,
      });

      if (data.id) {
        this.id = id;
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
      };
      const code = data?.error?.code || 400;
      if (code === 190) {
        this.valid = false;
        return false;
      } else {
        const error = new Error();
        throw new UnauthorizedError(
          "Error verifying user ID.",
          error,
          e as GraphError
        );
      }
    }
  }

  async generate(): Promise<string | undefined> {
    if (this.facebook.access.user.token === undefined) {
      const error = new Error();
      throw new CredentialError("User token is required.", error);
    }

    try {
      const data = await this.facebook.client.get("me", {
        access_token: this.facebook.access.user.token,
      });

      if (data.id) {
        this.id = data.id;
        this.expires = expire();
        this.valid = true;

        this.facebook.writeCredentials({
          userId: this.id,
          userIdExpires: this.expires,
        });

        return this.id;
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
          "Error generating user ID.",
          error,
          e as GraphError
        );
      }
    }
  }

  async refresh(
    id: string | undefined = this.id,
    expires: number | undefined = this.expires,
    token: string | undefined = this.facebook.access.user.token
  ): Promise<{
    id: string | undefined;
    expires: number | undefined;
  }> {
    if (id === undefined || token === undefined) {
      throw new CredentialError("User ID is missing.");
    }

    if (expires === undefined) {
      if (this.facebook.warnExpired) {
        warnConsole("User ID may be expired.");
      } else {
        const error = new Error();
        throw new CredentialError("User ID expiration is missing.", error);
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
            throw new CredentialError("Error refreshing user ID.", error);
          } else {
            return {
              id,
              expires: this.expires,
            };
          }
        });
      }
    });
  }
}
