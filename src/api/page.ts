import { Login } from "./login";
import { DEFAULT_TOKEN, DEFAULT_EXPIRE_ADD } from "./login";
import type { Token } from "./login";
import { GraphError, UnauthorizedError, CredentialError } from "../errors";

export const token = "pageToken";

export function validate(
  this: Login,
  pageToken: string | undefined = this.access.page.token,
  pageTokenExpires: number | undefined = this.access.page.expires
): Promise<boolean> {
  if (pageToken === undefined) {
    this.stale = [...this.stale, token];
    this.access.page.valid = false;
    return new Promise((resolve) => resolve(false));
  }

  const now = Date.now() / 1000;
  if (pageTokenExpires && now - pageTokenExpires >= this.expireTime) {
    this.stale = [...this.stale, token];
    this.access.page.valid = false;
    return new Promise((resolve) => resolve(false));
  }

  interface Data {
    data: {
      app_id: string;
      type: string;
      application: string;
      data_access_expires_at: number;
      expires_at: number;
      is_valid: boolean;
      issued_at: number;
      profile_id: string;
      scopes: string[];
      granular_scopes: Array<null[]>;
      user_id: string;
    };
  }
  interface Error {
    data: {
      error: {
        code: number;
        message: string;
      };
      is_valid: boolean;
      scopes: any[];
    };
  }

  return this.client
    .get("debug_token", { input_token: pageToken, access_token: pageToken })
    .then((data: Data) => {
      if (data.data.is_valid) {
        this.access.page.token = pageToken;
        this.access.page.expires =
          data.data.data_access_expires_at ||
          Date.now() / 1000 + DEFAULT_EXPIRE_ADD;
        this.access.page.valid = true;
        this.writeCredentials({
          pageToken,
          pageTokenExpires,
        });
        return true;
      } else {
        this.stale = [...this.stale, token];
        this.access.page.valid = false;
        return false;
      }
    })
    .catch((e: GraphError) => {
      const data: Error = e.data;
      const code = data.data.error.code || 400;
      if (code === 190) {
        this.stale = [...this.stale, token];
        this.access.page.valid = false;
        return false;
      } else {
        const error = new Error();
        throw new UnauthorizedError("Error verifying page token.", error, e);
      }
    });
}

export function generate(
  this: Login,
  valid: boolean = false,
  pageId: string | undefined = this.info.page.id,
  userToken: string | undefined = this.access.user.token
) {
  interface Data {
    access_token: string;
    id: string;
  }

  if (valid || this.access.page.valid) {
    return new Promise((resolve) => resolve(this.access.page.token));
  }

  if (pageId === undefined) {
    const error = new Error();
    throw new CredentialError("Page ID is required.", error);
  }

  if (userToken === undefined) {
    const error = new Error();
    throw new CredentialError("User token is required.", error);
  }

  return this.client
    .get(`${pageId}`, {
      access_token: userToken,
      fields: "access_token",
    })
    .then((data: Data) => {
      const accessToken = data.access_token;
      this.access.page.token = accessToken;
      this.writeCredentials({
        appId: this.id,
        appSecret: this.secret,
        pageToken: accessToken,
        pageTokenExpires: Date.now() / 1000 + DEFAULT_EXPIRE_ADD,
      });
    })
    .catch((e: GraphError) => {
      const error = new Error();
      throw new UnauthorizedError("Error verifying page token.", error, e);
    });
}

export function refresh(
  this: Login,
  pageToken: string | undefined = this.access.page.token,
  pageTokenExpires: number | undefined = this.access.page.expires
): Promise<string | undefined> {
  if (pageToken === undefined) {
    const error = new Error();
    throw new CredentialError("Page token is required.", error);
  }

  if (pageTokenExpires === undefined) {
    const error = new Error();
    throw new CredentialError("Page token expiration is required.", error);
  }

  return this.access.page
    .validate(pageToken, pageTokenExpires)
    .then((valid) => this.access.page.generate(valid));
}

export function page(t: Login) {
  return {
    ...DEFAULT_TOKEN,
    validate: validate.bind(t),
    generate: generate.bind(t),
    refresh: refresh.bind(t),
  };
}

export type Page = ReturnType<typeof page>;
