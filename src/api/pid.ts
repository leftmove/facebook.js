import { Login } from "./login";
import { DEFAULT_INFO, DEFAULT_EXPIRE_ADD } from "./login";
import type { Id } from "./login";

import { GraphError, UnauthorizedError, CredentialError } from "../errors";

export function validate(
  this: Login,
  pageId: string | undefined = this.info.page.id,
  pageIdExpires: number | undefined = this.info.page.expires,
  userToken: string | undefined = this.access.user.token
): Promise<boolean> {
  const token = "pageId";

  if (userToken === undefined || pageId === undefined) {
    this.stale = [...this.stale, token];
    this.info.page.valid = false;
    return new Promise((resolve) => resolve(false));
  }

  if (pageIdExpires && Date.now() / 1000 - pageIdExpires >= this.expireTime) {
    this.stale = [...this.stale, token];
    this.info.page.valid = false;
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
    .get(pageId, { access_token: userToken })
    .then((data: Data) => {
      const pageId = data.id;
      const pageIdExpires = Date.now() / 1000 + DEFAULT_EXPIRE_ADD;
      this.info.page.id = pageId;
      this.info.page.expires = pageIdExpires;
      this.info.page.valid = true;
      this.writeCredentials({ pageId, pageIdExpires });
      return true;
    })
    .catch((e: GraphError) => {
      const data: Error = e.data;
      const code = data?.error?.code || 400;
      if (code === 190) {
        this.stale = [...this.stale, token];
        this.info.page.valid = false;
        return false;
      } else {
        const error = new Error();
        throw new UnauthorizedError("Error verifying page ID.", error, e);
      }
    });
}

export function generate(
  this: Login,
  valid: boolean = false,
  userId: string | undefined = this.info.user.id,
  userToken: string | undefined = this.access.user.token,
  pageIndex: number | undefined = this.info.index
) {
  interface Data {
    data: {
      access_token: string;
      category: string;
      category_list: {
        id: string;
        name: string;
      }[];
      name: string;
      id: string;
      tasks: string[];
    }[];
    paging: {
      cursors: {
        before: string;
        after: string;
      };
    };
  }

  if (valid) {
    return new Promise((resolve) => resolve(this.info.page.id));
  }

  if (pageIndex === undefined) {
    pageIndex = 0;
  }

  if (userId === undefined) {
    const error = new Error();
    throw new CredentialError("User ID is required.", error);
  }

  if (userToken === undefined) {
    const error = new Error();
    throw new CredentialError("User token is required.", error);
  }

  return this.client
    .get(`${userId}/accounts`, {
      access_token: userToken,
    })
    .then((data: Data) => {
      const pageId = data.data[pageIndex].id;
      const pageIdExpires = Date.now() / 1000 + DEFAULT_EXPIRE_ADD;
      this.info.page.id = pageId;
      this.info.index = pageIndex;
      this.writeCredentials({
        appId: this.id,
        appSecret: this.secret,
        pageIndex,
        pageId,
        pageIdExpires,
      });
    })
    .catch((e: any) => {
      if (e instanceof GraphError) {
        const error = new Error();
        throw new UnauthorizedError("Error verifying page token.", error, e);
      } else {
        throw new UnauthorizedError("Error verifying page token.", e);
      }
    });
}

export function refresh(
  this: Login,
  pageId: string | undefined = this.info.page.id,
  pageIdExpires: number | undefined = this.info.page.expires,
  userId: string | undefined = this.info.user.id,
  userToken: string | undefined = this.access.user.token,
  pageIndex: number | undefined = this.info.index
): Promise<string | undefined> {
  if (pageId === undefined) {
    const error = new Error();
    throw new CredentialError("Page ID is required.", error);
  }

  if (pageIdExpires === undefined) {
    const error = new Error();
    throw new CredentialError("Page ID expiration is required.", error);
  }

  if (userId === undefined) {
    const error = new Error();
    throw new CredentialError("User ID is required.", error);
  }

  if (userToken === undefined) {
    const error = new Error();
    throw new CredentialError("User token is required.", error);
  }

  if (pageIndex === undefined) {
    const error = new Error();
    throw new CredentialError("Page index is required.", error);
  }

  return this.info.page
    .validate(pageId, pageIdExpires, userToken)
    .then((valid: boolean) => this.info.page.generate(valid));
}

export function pid(t: Login) {
  return {
    ...DEFAULT_INFO,
    validate: validate.bind(t),
    generate: generate.bind(t),
    refresh: refresh.bind(t),
  };
}
export type Pid = ReturnType<typeof pid>;
