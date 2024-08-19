import { Login } from "./login";
import { DEFAULT_INFO, DEFAULT_EXPIRE_ADD } from "./login";
import type { Id } from "./login";

import { GraphError, UnauthorizedError, CredentialError } from "../errors";

export function validate(
  this: Login,
  userId: string | undefined = this.info.user.id,
  userIdExpires: number | undefined = this.info.user.expires,
  userToken: string | undefined = this.access.user.token
): Promise<boolean> {
  const token = "userId";

  if (userToken === undefined || userId === undefined) {
    this.stale = [...this.stale, token];
    return new Promise((resolve) => resolve(false));
  }

  if (userIdExpires && Date.now() / 1000 - userIdExpires >= this.expireTime) {
    this.stale = [...this.stale, token];
    return new Promise((resolve) => resolve(false));
  }

  interface Data {
    name: string;
    id: string;
  }
  interface Error {
    error: {
      message: string;
      type: string;
      code: number;
      error_subcode: number;
      fbtrace_id: string;
    };
  }

  return this.client
    .get(userId, { access_token: userToken })
    .then((data: Data) => {
      const userId = data.id;
      this.info.user.id = userId;
      this.writeCredentials({ userId });
      return true;
    })
    .catch((e: GraphError) => {
      const data: Error = e.data;
      const code = data.error.code || 400;
      if (code === 190) {
        this.stale = [...this.stale, token];
        return false;
      } else {
        const error = new Error();
        throw new UnauthorizedError("Error verifying user ID.", error, e);
      }
    });
}

export function generate(
  this: Login,
  valid: boolean = false,
  userToken: string | undefined = this.access.user.token
) {
  interface Data {
    name: string;
    id: string;
  }

  if (valid) {
    return new Promise((resolve) => resolve(this.info.user.id));
  }

  if (userToken === undefined) {
    const error = new Error();
    throw new CredentialError("User token is required.", error);
  }

  return this.client
    .get("me", {
      access_token: userToken,
    })
    .then((data: Data) => {
      const userId = data.id;
      this.info.user.id = userId;
      this.writeCredentials({
        appId: this.id,
        appSecret: this.secret,
        userId,
        userIdExpires: Date.now() / 1000 + DEFAULT_EXPIRE_ADD,
      });
    })
    .catch((e: GraphError) => {
      const error = new Error();
      throw new UnauthorizedError("Error verifying page token.", error, e);
    });
}

export function resfresh(
  this: Login,
  userId: string | undefined = this.info.user.id,
  userIdExpires: number | undefined = this.info.user.expires,
  userToken: string | undefined = this.access.user.token
) {
  if (userId === undefined) {
    const error = new Error();
    throw new CredentialError("User ID is required.", error);
  }

  if (userIdExpires === undefined) {
    const error = new Error();
    throw new CredentialError("User ID expiration is required.", error);
  }

  if (userToken === undefined) {
    const error = new Error();
    throw new CredentialError("User token is required.", error);
  }

  return this.info.user
    .validate(userId, userIdExpires, userToken)
    .then((valid: boolean) => {
      if (valid) {
        return this;
      } else {
        return this.info.user.generate(valid, userToken);
      }
    });
}

export function uid(t: Login): Id {
  return {
    ...DEFAULT_INFO,
    validate: validate.bind(t),
    generate: generate.bind(t),
  } as Id;
}
