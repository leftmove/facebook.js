import { Login } from "./login";
import { DEFAULT_TOKEN, DEFAULT_EXPIRE_ADD } from "./login";
import type { Token } from "./login";

import { GraphError, UnauthorizedError, CredentialError } from "../errors";

export const token = "appToken";

export function validate(
  this: Login,
  appToken: string | undefined = this.access.app.token,
  appTokenExpires: number | undefined = this.access.app.expires
): Promise<boolean> {
  const appId = this.id;
  const appSecret = this.secret;

  if (appToken === undefined) {
    this.stale = [...this.stale, token];
    return new Promise((resolve) => resolve(false));
  }

  if (
    appTokenExpires &&
    Date.now() / 1000 - appTokenExpires >= this.expireTime
  ) {
    this.stale = [...this.stale, token];
    return new Promise((resolve) => resolve(false));
  }

  interface Data {
    data: {
      app_id: string;
      type: string;
      application: string;
      is_valid: boolean;
      scopes: Array<any>;
    };
  }
  interface Error {
    error: {
      message: string;
      type: string;
      code: number;
      fbtrace_id: string;
    };
  }

  return this.client
    .get("debug_token", {
      input_token: appToken,
      access_token: `${appId}|${appSecret}`,
    })
    .then((data: Data) => {
      if (data.data.is_valid) {
        return true;
      } else {
        this.stale = [...this.stale, token];
        return false;
      }
    })
    .catch((e: GraphError) => {
      const data: Error = e.data;
      const code = data.error.code || 400;
      if (code === 190) {
        this.stale = [...this.stale, token];
        return false;
      } else {
        const error = new Error();
        throw new UnauthorizedError("Error verifying app token.", error, e);
      }
    });
}

export function generate(this: Login) {
  interface Data {
    access_token: string;
    token_type: string;
  }

  if (this.access.app.valid) {
    return new Promise((resolve) => resolve(this.access.app.token));
  }

  return this.client
    .get("oauth/access_token", {
      client_id: this.id,
      client_secret: this.secret,
      grant_type: "client_credentials",
    })
    .then((data: Data) => {
      const accessToken = data.access_token;
      this.access.app.token = accessToken;
      this.writeCredentials({
        appId: this.id,
        appSecret: this.secret,
        appToken: accessToken,
        appTokenExpires: Date.now() / 1000 + DEFAULT_EXPIRE_ADD,
      });
    })
    .catch((e: GraphError) => {
      const error = new Error();
      throw new UnauthorizedError("Error verifying page token.", error, e);
    });
}

export function refresh(
  this: Login,
  appToken: string | undefined = this.access.app.token,
  appTokenExpires: number | undefined = this.access.app.expires
) {
  if (appToken === undefined) {
    const error = new Error();
    throw new CredentialError("App token is required.", error);
  }

  if (appTokenExpires === undefined) {
    const error = new Error();
    throw new CredentialError("App token expiration is required.", error);
  }

  return this.access.app
    .validate(appToken, appTokenExpires)
    .then((valid: boolean) =>
      valid
        ? undefined
        : this.access.app.generate(valid).then(() => this.access.app.token)
    );
}

export function app(t: Login): Token {
  return {
    ...DEFAULT_TOKEN,
    validate: validate.bind(t),
    generate: generate.bind(t),
    refresh: refresh.bind(t),
  } as Token;
}
