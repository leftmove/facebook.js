import Client from "./wrapper";
import {
  writeToJSONCredentials,
  readFromJSONCredentials,
  DEFAULT_FILE_PATH,
} from "../credentials";
import { CredentialError, UnauthorizedError, GraphError } from "../errors";
import type { Config } from "../client/client";
import type {
  Credentials,
  writeCredentials,
  readCredentials,
} from "../credentials";

export interface Permissions {
  commerce_account_manage_orders?: boolean;
  commerce_account_read_orders?: boolean;
  commerce_account_read_reports?: boolean;
  commerce_account_read_settings?: boolean;
  instagram_shopping_tag_products?: boolean;
  email?: boolean;
  Events_Groups_Pages?: boolean;
  ads_management?: boolean;
  ads_read?: boolean;
  business_management?: boolean;
  instagram_manage_events?: boolean;
  page_events?: boolean;
  pages_manage_ads?: boolean;
  pages_manage_cta?: boolean;
  pages_manage_engagement?: boolean;
  pages_manage_instant_articles?: boolean;
  pages_manage_metadata?: boolean;
  pages_manage_posts?: boolean;
  pages_messaging?: boolean;
  pages_messaging_subscriptions?: boolean;
  pages_read_engagement?: boolean;
  pages_read_user_content?: boolean;
  pages_show_list?: boolean;
  read_page_mailboxes?: boolean;
  catalog_management?: boolean;
  instagram_basic?: boolean;
  instagram_branded_content_ads_brand?: boolean;
  instagram_branded_content_brand?: boolean;
  instagram_branded_content_creator?: boolean;
  instagram_content_publish?: boolean;
  instagram_manage_comments?: boolean;
  instagram_manage_insights?: boolean;
  instagram_manage_messages?: boolean;
  leads_retrieval?: boolean;
  manage_fundraisers?: boolean;
  publish_video?: boolean;
  read_insights?: boolean;
  whatsapp_business_management?: boolean;
  whatsapp_business_messaging?: boolean;
}

export const DEFAULT_SCOPE: Permissions = {
  pages_manage_engagement: true,
  pages_manage_posts: true,
  pages_read_engagement: true,
  pages_read_user_content: true,
  pages_show_list: true,
  publish_video: true,
  read_insights: true,
  business_management: true,
};

export const DEFAULT_EXPIRE_TIME = 60;
export const DEFAULT_EXPIRE_ADD = 60 * 60 * 72;

export interface Authentication {
  path?: string;
  expireTime?: number;
  scope: Permissions;
  writeCredentials?: writeCredentials;
  readCredentials?: readCredentials;
}

export const DEFAULT_CONFIG: Authentication = {
  path: DEFAULT_FILE_PATH,
  expireTime: DEFAULT_EXPIRE_TIME,
  scope: DEFAULT_SCOPE,
  writeCredentials: writeToJSONCredentials,
  readCredentials: readFromJSONCredentials,
};

export interface Debug {
  data: {
    app_id: string;
    type: string;
    application: string;
    is_valid: boolean;
    scopes: any[];
  };
}

export interface DebugError {
  error: {
    code: number;
    message: string;
  };
  is_valid: boolean;
  scopes: any[];
}

export const credentialOptions = [
  "appId",
  "appSecret",
  "appToken",
  "userToken",
  "userId",
  "pageId",
  "pageToken",
];

export class Login {
  appId: string;
  appSecret: string;

  stale: Array<string> = credentialOptions;
  client = new Client();

  writeCredentials: writeCredentials = writeToJSONCredentials;
  readCredentials: readCredentials = readFromJSONCredentials;
  expireTime: number = DEFAULT_EXPIRE_TIME;

  appToken?: string;
  appTokenExpires?: number;
  userToken?: string;
  userId?: string;
  userIdExpires?: number;
  userTokenExpires?: number;
  pageId?: string;
  pageIdExpires?: number;
  pageIndex?: number;
  pageToken?: string;
  pageTokenExpires?: number;

  overrideLocal = true;

  scope: Permissions = {
    pages_manage_engagement: true,
    pages_manage_posts: true,
    pages_read_engagement: true,
    pages_read_user_content: true,
    pages_show_list: true,
    read_insights: true,
    business_management: true,
  };

  constructor(config: Config = {}) {
    const readCredentials = config.readCredentials || readFromJSONCredentials;
    const writeCredentials = config.writeCredentials || writeToJSONCredentials;
    const credentials = readCredentials();

    const appId = config.appId || credentials.appId || undefined;
    const appSecret = config.appSecret || credentials.appSecret || undefined;

    if (appId === undefined || appSecret === undefined) {
      throw new CredentialError(
        "Empty credentials provided. App ID and App Secret are required."
      );
    }

    // If the credentials/config object doesn't have all the correct properties (a likely
    // problem), the following variables will still be filled because of the fallbacks.
    // This would normally cause an error in TS, but the Credentials type fixes
    // this, even though the values may possibly be undefined.

    const appToken = config.appToken || credentials.appToken || this.appToken;
    const appTokenExpires =
      config.appTokenExpires ||
      credentials.appTokenExpires ||
      this.appTokenExpires;
    const userToken =
      config.userToken || credentials.userToken || this.userToken;
    const userId = config.userId || credentials.userId || this.userId;
    const userIdExpires =
      config.userIdExpires || credentials.userIdExpires || this.userIdExpires;
    const userTokenExpires =
      config.userTokenExpires ||
      credentials.userTokenExpires ||
      this.userTokenExpires;
    const pageToken =
      config.pageToken || credentials.pageToken || this.pageToken;
    const pageId = config.pageId || credentials.pageId || this.pageId;
    const pageIdExpires =
      config.pageIdExpires || credentials.pageIdExpires || this.pageIdExpires;
    const pageIndex = Number(
      config.pageIndex || credentials.pageIndex?.toString() || this.pageIndex
    );
    const pageTokenExpires =
      config.pageTokenExpires ||
      credentials.pageTokenExpires ||
      this.pageTokenExpires;

    const scope = config.scope || credentials.scope || this.scope;
    const overrideLocal = config.overrideLocal || this.overrideLocal;

    this.appId = appId;
    this.appSecret = appSecret;
    this.appToken = appToken;
    this.appTokenExpires = appTokenExpires;
    this.userToken = userToken;
    this.userId = userId;
    this.userIdExpires = userIdExpires;
    this.userTokenExpires = userTokenExpires;
    this.pageId = pageId;
    this.pageIdExpires = pageIdExpires;
    this.pageIndex = pageIndex;
    this.pageToken = pageToken;
    this.pageTokenExpires = pageTokenExpires;
    this.scope = scope;
    this.writeCredentials = writeCredentials;
    this.readCredentials = readCredentials;
    this.overrideLocal = overrideLocal;

    if (overrideLocal) {
      writeCredentials({
        appId,
        appSecret,
        appToken,
        userToken,
        userId,
        userTokenExpires,
        pageIndex,
        pageId,
        pageToken,
        pageTokenExpires,
        scope,
      });
    }
  }

  verifyAppCredentials(
    appId: string = this.appId,
    appSecret: string = this.appSecret
  ) {
    const token = ["appId", "appSecret"];
    const appAccessToken = `${appId}|${appSecret}`;

    if (appId === undefined || appSecret === undefined) {
      const error = new Error();
      throw new CredentialError("App ID and App Secret are required.", error);
    }

    return this.client
      .get("debug_token", {
        input_token: appAccessToken,
        access_token: appAccessToken,
      })
      .then((data: Debug) => {
        if (data.data.is_valid) {
          return true;
        } else {
          this.stale = [...this.stale, ...token];
          return false;
        }
      })
      .catch((e: GraphError) => {
        const data: DebugError = e.data;
        const code = data?.error?.code || 400;
        if (code === 190) {
          this.stale = [...this.stale, ...token];
          return false;
        } else {
          const error = new Error();
          throw new UnauthorizedError(
            "Error verifying app credentials.",
            error,
            e
          );
        }
      });
  }

  verifyAppToken(
    appToken: string | undefined = this.appToken,
    appTokenExpires: number | undefined = this.appTokenExpires
  ) {
    const token = "appToken";

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
        access_token: `${this.appId}|${this.appSecret}`,
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

  verifyUserCredentials(
    userToken: string | undefined = this.userToken,
    userTokenExpires: number | undefined = this.userTokenExpires
  ) {
    const token = "userToken";

    if (userToken === undefined) {
      this.stale = [...this.stale, token];
      return new Promise((resolve) => resolve(false));
    }

    const now = Date.now() / 1000;
    if (userTokenExpires && now - userTokenExpires >= this.expireTime) {
      this.stale = [...this.stale, token];
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
        if (data.data.is_valid) {
          this.writeCredentials({
            appId: this.appId,
            appSecret: this.appSecret,
            userId: data.data.user_id,
            userToken,
            userTokenExpires: data.data.data_access_expires_at,
          });
          return true;
        } else {
          this.stale = [...this.stale, token];
          return false;
        }
      })
      .catch((e: GraphError) => {
        const data: Error = e.data;
        const code = data?.error?.code || 400;
        if (code === 190) {
          this.stale = [...this.stale, token];
          return false;
        } else {
          const error = new Error();
          throw new UnauthorizedError("Error verifying user token.", error, e);
        }
      });
  }

  verifyUserId(
    userId: string | undefined = this.userId,
    userIdExpires: number | undefined = this.userIdExpires,
    userToken: string | undefined = this.userToken
  ) {
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

  verifyPageId(
    pageId: string | undefined = this.appId,
    pageIdExpires: number | undefined = this.pageIdExpires,
    userToken: string | undefined = this.userToken
  ) {
    const token = "pageId";

    if (userToken === undefined || pageId === undefined) {
      this.stale = [...this.stale, token];
      return new Promise((resolve) => resolve(false));
    }

    if (pageIdExpires && Date.now() / 1000 - pageIdExpires >= this.expireTime) {
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
      .get(pageId, { access_token: userToken })
      .then((data: Data) => {
        return true;
      })
      .catch((e: GraphError) => {
        const data: Error = e.data;
        const code = data?.error?.code || 400;
        if (code === 190) {
          this.stale = [...this.stale, token];
          return false;
        } else {
          const error = new Error();
          throw new UnauthorizedError("Error verifying page ID.", error, e);
        }
      });
  }

  verifyPageCredentials(
    pageToken: string | undefined = this.pageToken,
    pageTokenExpires: number | undefined = this.pageTokenExpires
  ) {
    const token = "pageToken";

    if (pageToken === undefined) {
      this.stale = [...this.stale, token];
      return new Promise((resolve) => resolve(false));
    }

    const now = Date.now() / 1000;
    if (pageTokenExpires && now - pageTokenExpires >= this.expireTime) {
      this.stale = [...this.stale, token];
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
          this.writeCredentials({
            appId: this.appId,
            appSecret: this.appSecret,
            pageToken,
            pageTokenExpires: data.data.data_access_expires_at,
          });
          return true;
        } else {
          this.stale = [...this.stale, token];
          return false;
        }
      })
      .catch((e: GraphError) => {
        const data: Error = e.data;
        const code = data.data.error.code || 400;
        if (code === 190) {
          this.stale = [...this.stale, token];
          return false;
        } else {
          const error = new Error();
          throw new UnauthorizedError("Error verifying page token.", error, e);
        }
      });
  }

  verify(
    options: Array<string> = this.stale,
    readCredentials: readCredentials = this.readCredentials,
    writeCredentials: writeCredentials = this.writeCredentials,
    expireTime: number = this.expireTime
  ) {
    const credentials = readCredentials();
    this.readCredentials = readCredentials;
    this.writeCredentials = writeCredentials;
    this.expireTime = expireTime;

    const emptyCredentials = options.filter(
      (option) => !credentials[option as keyof Credentials]
    );
    this.stale = emptyCredentials;

    if ("appToken" in emptyCredentials === true) {
      this.verifyAppToken(
        credentials.appToken as string,
        credentials.appTokenExpires as number
      );
    }

    if ("userToken" in emptyCredentials === true) {
      this.verifyUserCredentials(
        credentials.userToken as string,
        credentials.userTokenExpires as number
      );
    }

    if ("userId" in emptyCredentials === true) {
      this.verifyUserId(
        credentials.userId as string,
        credentials.userIdExpires as number,
        credentials.userToken as string
      );
    }

    if ("pageId" in emptyCredentials === true) {
      this.verifyPageId(
        credentials.pageId as string,
        credentials.pageIdExpires as number,
        credentials.userToken as string
      );
    }

    if ("pageToken" in emptyCredentials === true) {
      this.verifyPageCredentials(
        credentials.pageToken as string,
        credentials.pageTokenExpires as number
      );
    }

    if (new Set(this.stale).size !== this.stale.length) {
      throw new CredentialError("Stale credentials contain duplicates.");
    }

    this.stale = this.stale.sort((a, b) => {
      const indexA = credentialOptions.indexOf(a);
      const indexB = credentialOptions.indexOf(b);
      return indexA - indexB;
    });
    return this;
  }

  refreshAppToken(appId: string, appSecret: string) {
    interface Data {
      access_token: string;
      token_type: string;
    }
    return this.client
      .get("oauth/access_token", {
        client_id: appId,
        client_secret: appSecret,
        grant_type: "client_credentials",
      })
      .then((data: Data) => {
        const accessToken = data.access_token;
        this.appToken = accessToken;
        this.writeCredentials({
          appId: appId,
          appSecret: appSecret,
          appToken: accessToken,
          appTokenExpires: Date.now() / 1000 + DEFAULT_EXPIRE_ADD,
        });
      })
      .catch((e: GraphError) => {
        const error = new Error();
        throw new UnauthorizedError("Error verifying page token.", error, e);
      });
  }

  refreshUserToken(
    appId: string,
    appSecret: string,
    redirect: string,
    code: string
  ) {
    interface Data {
      access_token: string;
      token_type: string;
      expires_in: number;
    }
    return this.client
      .get("oauth/access_token", {
        code,
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirect,
      })
      .then((data: Data) => {
        const userToken = data.access_token;
        const userTokenExpires = data.expires_in;
        this.userToken = userToken;
        this.userTokenExpires = userTokenExpires;
        this.writeCredentials({
          appId,
          appSecret,
          userToken,
          userTokenExpires,
        });
      })
      .catch((e: GraphError) => {
        const error = new Error();
        throw new UnauthorizedError("Error getting user token.", error, e);
      });
  }

  refreshUserId(appId: string, appSecret: string, userToken: string) {
    interface Data {
      name: string;
      id: string;
    }
    return this.client
      .get("me", {
        access_token: userToken,
      })
      .then((data: Data) => {
        const userId = data.id;
        this.userId = userId;
        this.writeCredentials({
          appId,
          appSecret,
          userId,
          userIdExpires: Date.now() / 1000 + DEFAULT_EXPIRE_ADD,
        });
      })
      .catch((e: GraphError) => {
        const error = new Error();
        throw new UnauthorizedError("Error verifying page token.", error, e);
      });
  }

  refreshPageId(
    appId: string,
    appSecret: string,
    userId: string,
    userToken: string,
    pageIndex: number | undefined
  ) {
    if (pageIndex === undefined) {
      pageIndex = 0;
    }

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
    return this.client
      .get(`${userId}/accounts`, {
        access_token: userToken,
      })
      .then((data: Data) => {
        const pageId = data.data[pageIndex].id;
        this.pageId = pageId;
        this.pageIndex = pageIndex;
        this.writeCredentials({
          appId,
          appSecret,
          pageIndex,
          pageId,
          pageIdExpires: Date.now() / 1000 + DEFAULT_EXPIRE_ADD,
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

  refreshPageToken(
    appId: string,
    appSecret: string,
    pageId: string,
    userToken: string
  ) {
    interface Data {
      access_token: string;
      id: string;
    }
    return this.client
      .get(`${pageId}`, {
        access_token: userToken,
        fields: "access_token",
      })
      .then((data: Data) => {
        const accessToken = data.access_token;
        this.pageToken = accessToken;
        this.writeCredentials({
          appId,
          appSecret,
          pageToken: accessToken,
          pageTokenExpires: Date.now() / 1000 + DEFAULT_EXPIRE_ADD,
        });
      })
      .catch((e: GraphError) => {
        const error = new Error();
        throw new UnauthorizedError("Error verifying page token.", error, e);
      });
  }

  refresh(credentials: Array<string> = this.stale) {
    credentials.map((c) => {
      switch (c) {
        case "appToken":
          this.refreshAppToken(this.appId, this.appSecret);
          break;
        case "userId":
          if (this.userToken === undefined) {
            const error = new Error();
            throw new CredentialError(
              "Error getting user ID, user token is required first.",
              error
            );
          }
          this.refreshUserId(this.appId, this.appSecret, this.userToken);
          break;
        case "pageId":
          if (this.userId === undefined || this.userToken === undefined) {
            const error = new Error();
            throw new CredentialError(
              "Error getting page ID, user ID, and user token are required first.",
              error
            );
          }
          this.refreshPageId(
            this.appId,
            this.appSecret,
            this.userId,
            this.userToken,
            this.pageIndex
          );
          break;
        case "pageToken":
          if (this.pageId === undefined || this.userToken === undefined) {
            const error = new Error();
            throw new CredentialError(
              "Error getting page token, page ID and user token are required first.",
              error
            );
          }
          this.refreshPageToken(
            this.appId,
            this.appSecret,
            this.pageId,
            this.userToken
          );
          break;
        default:
          break;
      }
    });
  }

  login(config: Authentication = DEFAULT_CONFIG) {
    const writeCredentials = config.writeCredentials || writeToJSONCredentials;
    const readCredentials = config.readCredentials || readFromJSONCredentials;
    const expireTime = config.expireTime || DEFAULT_EXPIRE_TIME;

    this.verify(this.stale, readCredentials, writeCredentials, expireTime);
    this.refresh(this.stale);
    this.verify(this.stale, readCredentials, writeCredentials, expireTime);

    if (this.stale.length > 0) {
      console.warn(
        "Error refreshing credentials, some credentials were unable to be refreshed: " +
          this.stale
      );
    }

    return this;
  }

  credentials(
    options: { error: boolean; expirations: boolean; index: boolean } = {
      error: true,
      expirations: true,
      index: true,
    }
  ) {
    return new Promise((resolve) => {
      const {
        appId,
        appSecret,
        appToken,
        appTokenExpires,
        userToken,
        userTokenExpires,
        userId,
        userIdExpires,
        pageId,
        pageIdExpires,
        pageIndex,
        pageToken,
        pageTokenExpires,
      } = this;

      const warn = (message: string) => {
        if (options.error) {
          const error = new Error();
          throw new CredentialError(message, error);
        } else {
          console.warn(message);
        }
      };

      // This will never happen
      if (appId === undefined) {
        warn("App ID is missing.");
      }

      if (appSecret === undefined) {
        warn("App secret is missing.");
      }

      if (appToken === undefined) {
        warn("App token is missing.");
      }

      if (options.expirations && appTokenExpires === undefined) {
        warn("App token expiration is missing.");
      }

      if (userToken === undefined) {
        warn("User token is missing.");
      }

      if (options.expirations && userTokenExpires === undefined) {
        warn("User token expiration is missing.");
      }

      if (userId === undefined) {
        warn("User ID is missing.");
      }

      if (options.expirations && userIdExpires === undefined) {
        warn("User ID expiration is missing.");
      }

      if (pageId === undefined) {
        warn("Page ID is missing.");
      }

      if (options.expirations && pageIdExpires === undefined) {
        warn("Page ID expiration is missing.");
      }

      if (pageIndex === undefined) {
        warn("Page index is missing.");
      }

      if (pageToken === undefined) {
        warn("Page token is missing.");
      }

      if (options.index && pageTokenExpires === undefined) {
        warn("Page token expiration is missing.");
      }

      resolve({
        appId,
        appSecret,
        appToken,
        appTokenExpires,
        userToken,
        userTokenExpires,
        userId,
        userIdExpires,
        pageId,
        pageIdExpires,
        pageIndex,
        pageToken,
        pageTokenExpires,
      });
    });
  }
}
