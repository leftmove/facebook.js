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

import { user } from "./user";
import { app } from "./app";
import { page } from "./page";
import { uid } from "./uid";
import { pid } from "./pid";

export interface Permissions {
  [key: string]: boolean | undefined;

  public_profile?: boolean;
  commerce_account_manage_orders?: boolean;
  commerce_account_read_orders?: boolean;
  commerce_account_read_reports?: boolean;
  commerce_account_read_settings?: boolean;
  instagram_shopping_tag_products?: boolean;
  email?: boolean;
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
  public_profile: true,
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

type Validate = (...args: any) => Promise<boolean>;
type Generate = (...args: any) => Promise<string | undefined | ThisType<Login>>;
type Refresh = (...args: any) => Promise<any>;

export interface Token {
  validate: Validate;
  generate: Generate;
  refresh: Refresh;
  token: string | undefined;
  expires: number | undefined;
  valid: boolean;
}

export const DEFAULT_TOKEN: Token = {
  validate: () => new Promise((resolve) => resolve(false)),
  generate: () => new Promise((resolve) => resolve(undefined)),
  refresh: () => new Promise((resolve) => resolve(undefined)),
  token: undefined,
  expires: undefined,
  valid: false,
};

export interface Id {
  validate: Validate;
  generate: Generate;
  refresh: Refresh;
  id: string | undefined;
  expires: number | undefined;
  valid: boolean;
}

export const DEFAULT_INFO: Id = {
  validate: () => new Promise((resolve) => resolve(false)),
  generate: () => new Promise((resolve) => resolve(undefined)),
  refresh: () => new Promise((resolve) => resolve(undefined)),
  id: undefined,
  expires: undefined,
  valid: false,
};
export const DEFAULT_INDEX = 0;

export interface Access {
  app: Token;
  user: Token;
  page: Token;
}

export interface Info {
  page: Id;
  user: Id;
  index: number;
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
  id: string;
  secret: string;

  stale: Array<string> = credentialOptions;
  client = new Client();

  writeCredentials: writeCredentials = writeToJSONCredentials;
  readCredentials: readCredentials = readFromJSONCredentials;
  expireTime: number = DEFAULT_EXPIRE_TIME;

  access: Access = {
    app: app(this),
    user: user(this),
    page: page(this),
  };
  info: Info = {
    page: pid(this),
    user: uid(this),
    index: DEFAULT_INDEX,
  };

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

    const appId = config.id || credentials.appId || undefined;
    const appSecret = config.secret || credentials.appSecret || undefined;

    if (appId === undefined || appSecret === undefined) {
      throw new CredentialError(
        "Empty credentials provided. App ID and App Secret are required."
      );
    }

    const scope = config.scope || credentials.scope || this.scope;
    const overrideLocal = config.overrideLocal || this.overrideLocal;

    // If the credentials/config object doesn't have all the correct properties (a likely
    // problem), the following variables will still be filled because of the fallbacks.
    // This would normally cause an error in TS, but the Credentials type fixes
    // this, even though the values may possibly be undefined.

    // Basic credentials
    this.id = appId;
    this.secret = appSecret;

    // App token
    this.access.app.token =
      config?.access?.app?.token ||
      credentials.appToken ||
      this.access.app.token;
    this.access.app.expires =
      config?.access?.app?.expires ||
      credentials.appTokenExpires ||
      this.access.app.expires;

    // User token
    this.access.user.token =
      config?.access?.user?.token ||
      credentials.userToken ||
      this.access.user.token;
    this.access.user.expires =
      config?.access?.user?.expires ||
      credentials.userTokenExpires ||
      this.access.user.expires;

    // Page token
    this.access.page.token =
      config?.access?.page?.token ||
      credentials.pageToken ||
      this.access.page.token;
    this.access.page.expires =
      config?.access?.page?.expires ||
      credentials.pageTokenExpires ||
      this.access.page.expires;

    // User ID
    this.info.user.id =
      config?.info?.user?.id || credentials.userId || this.info.user.id;
    this.info.user.expires =
      config?.info?.user?.expires || this.info.user.expires;

    // Page ID
    this.info.page.id =
      config?.info?.page?.id || credentials.pageId || this.info.page.id;
    this.info.page.expires =
      config?.info?.page?.expires ||
      credentials.pageIdExpires ||
      this.info.page.expires;

    // Page index
    this.info.index =
      config?.info?.index || credentials.pageIndex || this.info.index;

    this.scope = scope;
    this.writeCredentials = writeCredentials;
    this.readCredentials = readCredentials;
    this.overrideLocal = overrideLocal;

    if (overrideLocal) {
      writeCredentials({
        appId,
        appSecret,
        appToken: this.access.app.token,
        userToken: this.access.user.token,
        userId: this.info.user.id,
        userTokenExpires: this.access.user.expires,
        pageIndex: this.info.index,
        pageId: this.info.page.id,
        pageToken: this.access.page.token,
        pageTokenExpires: this.access.page.expires,
        scope,
      });
    }
  }

  validate(): Promise<boolean> {
    const token = ["appId", "appSecret"];

    if (this.id === undefined || this.secret === undefined) {
      const error = new Error();
      throw new CredentialError("App ID and App Secret are required.", error);
    }
    const appAccessToken = `${this.id}|${this.secret}`;

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

  refresh(
    credentials: string[] = [
      "appToken",
      "userId",
      "userToken",
      "pageId",
      "pageToken",
    ]
  ) {
    const promises = credentials.map((c) => {
      switch (c) {
        case "appToken":
          return new Promise((resolve) => resolve(this.access.app.refresh()));
        case "userId":
          return new Promise((resolve) => resolve(this.info.user.refresh()));
        case "userToken":
          return new Promise((resolve) => resolve(this.access.user.refresh()));
        case "pageId":
          return new Promise((resolve) => resolve(this.info.page.refresh()));
        case "pageToken":
          return new Promise((resolve) => resolve(this.access.page.refresh()));
        default:
          break;
      }
    });
    return Promise.all(promises);
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
      this.access.app.validate(
        credentials.appToken as string,
        credentials.appTokenExpires as number
      );
    }

    if ("userToken" in emptyCredentials === true) {
      this.access.user.validate(
        credentials.userToken as string,
        credentials.userTokenExpires as number
      );
    }

    if ("userId" in emptyCredentials === true) {
      this.info.user.validate(
        credentials.userId as string,
        credentials.userIdExpires as number,
        credentials.userToken as string
      );
    }

    if ("pageId" in emptyCredentials === true) {
      this.info.page.validate(
        credentials.pageId as string,
        credentials.pageIdExpires as number,
        credentials.userToken as string
      );
    }

    if ("pageToken" in emptyCredentials === true) {
      this.access.page.validate(
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

  generate(credentials: Array<string> = this.stale) {
    credentials.map((c) => {
      switch (c) {
        case "appToken":
          this.access.app.generate();
          break;
        case "userId":
          this.info.user.generate();
          break;
        case "pageId":
          this.info.page.generate();
          break;
        case "pageToken":
          this.access.page.generate();
          break;
        default:
          break;
      }
    });
    return this;
  }

  login(config: Authentication = DEFAULT_CONFIG) {
    const writeCredentials = config.writeCredentials || writeToJSONCredentials;
    const readCredentials = config.readCredentials || readFromJSONCredentials;
    const expireTime = config.expireTime || DEFAULT_EXPIRE_TIME;

    // These don't really do anything since they are asynchronous.
    // They're just there to make sure that credentials are generated
    // at some point in the future.
    // Even though this function returns `this`, it doesn't wait for
    // the following promises to resolve before returning.
    // The real verification/generation happens in the `credentials` function
    // or (more importantly) before the program even runs in the login CLI.
    this.generate(this.stale).verify(
      this.stale,
      readCredentials,
      writeCredentials,
      expireTime
    );

    // Will not work because the promises are not awaited.
    // if (this.stale.length > 0) {
    //   console.warn(
    //     "Error generateing credentials, some credentials were unable to be generateed: " +
    //       this.stale
    //   );
    // }

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
        id: appId,
        secret: appSecret,
        access: {
          app: { token: appToken, expires: appTokenExpires },
          user: { token: userToken, expires: userTokenExpires },
          page: { token: pageToken, expires: pageTokenExpires },
        },
        info: {
          user: { id: userId, expires: userIdExpires },
          page: { id: pageId, expires: pageIdExpires },
          index: pageIndex,
        },
      }: { id: string; secret: string; access: Access; info: Info } = this;

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
