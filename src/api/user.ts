import { DEFAULT_TOKEN, Login } from "./login";
import { DEFAULT_EXPIRE_ADD, DEFAULT_SCOPE } from "./login";

import { GraphError, UnauthorizedError, CredentialError } from "../errors";

export function validate(
  this: Login,
  userToken: string | undefined = this.access.user.token,
  userTokenExpires: number | undefined = this.access.user.expires
): Promise<boolean> {
  const token = "userToken";

  if (userToken === undefined) {
    this.stale = [...this.stale, token];
    this.access.user.valid = false;
    return new Promise((resolve) => resolve(false));
  }

  const now = Date.now() / 1000;
  if (userTokenExpires && now - userTokenExpires >= this.expireTime) {
    this.stale = [...this.stale, token];
    this.access.user.valid = false;
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
      scopes: Array<string>;
      granular_scopes: Array<{
        scope: string;
        target_ids?: Array<string>;
      }>;
      user_id: string;
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
    .get("debug_token", { input_token: userToken, access_token: userToken })
    .then((data: Data) => {
      // const scopes = data.data.granular_scopes.map((scope) => scope.scope);
      // const scopes2 = data.data.scopes;
      // const scopes3 = Object.keys(this.scope)
      //   .filter((key) => this.scope[key] === true)
      //   .sort()
      //   .join(",");
      // const scopes4 = scopes.sort().join(",");
      // const scopes5 = Object.keys(DEFAULT_SCOPE).sort().join(",");
      // console.log(
      //   "1\n",
      //   scopes,
      //   "2\n",
      //   scopes2,
      //   "3\n",
      //   scopes3,
      //   "4\n",
      //   scopes4,
      //   "5\n",
      //   scopes5
      // );
      if (data.data.is_valid) {
        const userId = data.data.user_id;
        const userTokenExpires = data.data.data_access_expires_at;

        const scopes = Object.keys(this.scope).filter(
          (key: string) => this.scope[key]
        );
        if (
          scopes.filter((scope) => data.data.scopes.includes(scope) === false)
            .length
        ) {
          this.stale = [...this.stale, token];
          this.access.user.valid = false;
          return false;
        }

        this.info.user.id = userId;
        this.access.user.token = userToken;
        this.access.user.expires =
          userTokenExpires || Date.now() / 1000 + DEFAULT_EXPIRE_ADD;
        this.access.user.valid = true;
        this.writeCredentials({
          userId,
          userToken,
          userTokenExpires: data.data.data_access_expires_at,
        });
        return true;
      } else {
        this.stale = [...this.stale, token];
        this.access.user.valid = false;
        return false;
      }
    })
    .catch((e: any) => {
      if (e instanceof GraphError) {
        const data: Error = e.data;
        const code = data?.error?.code || 400;
        if (code === 190) {
          this.stale = [...this.stale, token];
          this.access.user.valid = false;
          return false;
        } else {
          const error = new Error();
          throw new UnauthorizedError("Error verifying user token.", error, e);
        }
      } else {
        throw e;
      }
    });
}

export function generate(
  this: Login,
  valid: boolean = false,
  redirect: string,
  code: string
) {
  interface Data {
    access_token: string;
    token_type: string;
    expires_in: number;
  }

  if (valid || this.access.user.valid) {
    return new Promise((resolve) => resolve(this.access.user.token));
  }

  return this.client
    .get("oauth/access_token", {
      code,
      client_id: this.id,
      client_secret: this.secret,
      redirect_uri: redirect,
    })
    .then((data: Data) => {
      const userToken = data.access_token;
      const userTokenExpires =
        data.expires_in || Date.now() / 1000 + DEFAULT_EXPIRE_ADD;
      this.access.user.token = userToken;
      this.access.user.expires = userTokenExpires;
      this.writeCredentials({
        appId: this.id,
        appSecret: this.secret,
        userToken,
        userTokenExpires,
      });
    })
    .catch((e: GraphError) => {
      const error = new Error();
      throw new UnauthorizedError("Error getting user token.", error, e);
    });
}

// export function refresh(
//   this: Login,
//   userToken: string | undefined = this.access.user.token,
//   userTokenExpires: number | undefined = this.access.user.expires
// ): Promise<string | undefined> {
//   if (userToken === undefined) {
//     const error = new Error();
//     throw new CredentialError("User token is required.", error);
//   }

//   if (userTokenExpires === undefined) {
//     const error = new Error();
//     throw new CredentialError("User token expiration is required.", error);
//   }

//   return this.access.user
//     .validate(userToken, userTokenExpires)
//     .then((valid: boolean) => {
//       if (valid) {
//         return this.access.user.generate(valid);
//       } else {
//         throw new CredentialError(
//           "User token is required. Since user tokens cannot be generated automatically, you must login again using the login command."
//         );
//       }
//     });
// }

export function user(t: Login) {
  return {
    ...DEFAULT_TOKEN,
    validate: validate.bind(t),
    generate: generate.bind(t),
  };
}

export type User = ReturnType<typeof user>;
