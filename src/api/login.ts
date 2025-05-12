import Client from "./wrapper";
import {
  writeToJSONCredentials,
  readFromJSONCredentials,
  DEFAULT_FILE_PATH,
} from "../credentials";
import {
  CredentialError,
  UnauthorizedError,
  GraphError,
  warnConsole,
} from "../errors";
import type { Config } from "../client/client";
import type {
  Credentials,
  writeCredentials,
  readCredentials,
} from "../credentials";

import { User } from "./user";
import { App } from "./app";
import { Page } from "./page";
import { Pid } from "./pid";
import { Uid } from "./uid";

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
  user_posts?: boolean;
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
export const DEFAULT_EXPIRE_ADD = 60 * 60 * 2;

export const expire = (time: number = DEFAULT_EXPIRE_TIME) =>
  Date.now() / 1000 + time;

export type Profile = "page" | "user";

export interface Authentication {
  profile?: Profile;
  path?: string;
  expireTime?: number;
  scope?: Permissions;
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
  app: App;
  user: User;
  page: Page;
}

export interface Info {
  page: Pid;
  user: Uid;
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
  profile: Profile;

  stale: Array<string> = credentialOptions;
  client = new Client();

  writeCredentials: writeCredentials = writeToJSONCredentials;
  readCredentials: readCredentials = readFromJSONCredentials;
  expireTime: number = DEFAULT_EXPIRE_TIME;

  access: Access = {
    app: new App(this),
    user: new User(this),
    page: new Page(this),
  };
  info: Info = {
    page: new Pid(this),
    user: new Uid(this),
    index: DEFAULT_INDEX,
  };

  overrideLocal = true;
  warnExpired = true;
  scope: Permissions = DEFAULT_SCOPE;

  constructor(config: Config = {}) {
    const readCredentials = config.readCredentials || readFromJSONCredentials;
    const writeCredentials = config.writeCredentials || writeToJSONCredentials;
    const credentials = readCredentials();

    const appId = config.id || credentials.appId || undefined;
    const appSecret = config.secret || credentials.appSecret || undefined;
    const profile = config.profile || credentials.profile || "page";

    if (appId === undefined || appSecret === undefined) {
      throw new Error(
        "Empty credentials provided. App ID and App Secret are required. You should login first.\n" +
          "You can do this by calling the login command: `npx facebook login`." +
          "\nOnce you are logged in, make sure to protect the sensitive `credentials.json` created in the current directory."
      );
    }

    const scope = config.scope || credentials.scope || this.scope;
    const overrideLocal = config.overrideLocal || this.overrideLocal;
    const warnExpired = config.warnExpired || this.warnExpired;

    // If the credentials/config object doesn't have all the correct properties (a likely
    // problem), the following variables will still be filled because of the fallbacks.
    // This would normally cause an error in TS, but the Credentials type fixes
    // this, even though the values may possibly be undefined.

    // Basic credentials
    this.id = appId;
    this.secret = appSecret;
    this.profile = profile;

    // App token
    this.access.app.token =
      config?.appToken || credentials.appToken || this.access.app.token;
    this.access.app.expires =
      config?.appTokenExpires ||
      credentials.appTokenExpires ||
      this.access.app.expires;

    // User token
    this.access.user.token =
      config.userToken || credentials.userToken || this.access.user.token;
    this.access.user.expires =
      config?.userIdExpires ||
      credentials.userTokenExpires ||
      this.access.user.expires;

    // Page token
    this.access.page.token =
      config?.pageToken || credentials.pageToken || this.access.page.token;
    this.access.page.expires =
      config?.pageTokenExpires ||
      credentials.pageTokenExpires ||
      this.access.page.expires;

    // User ID
    this.info.user.id =
      config?.userId || credentials.userId || this.info.user.id;
    this.info.user.expires =
      config?.userIdExpires ||
      credentials.userIdExpires ||
      this.info.user.expires;

    // Page ID
    this.info.page.id =
      config?.pageId || credentials.pageId || this.info.page.id;
    this.info.page.expires =
      config?.pageIdExpires ||
      credentials.pageIdExpires ||
      this.info.page.expires;

    // Page index
    this.info.index =
      config?.pageIndex || credentials.pageIndex || this.info.index;

    this.scope = scope;
    this.writeCredentials = writeCredentials;
    this.readCredentials = readCredentials;
    this.overrideLocal = overrideLocal;
    this.warnExpired = warnExpired;
    if (overrideLocal) {
      writeCredentials({
        appId,
        appSecret,
        profile,
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
    ],
    permissions: string[] = [],
    warn: boolean = this.warnExpired
  ): Promise<unknown[]> {
    const promises = [
      ...credentials.map((c) => {
        switch (c) {
          case "appToken":
            return new Promise((resolve) => resolve(this.access.app.refresh()));
          case "userId":
            return new Promise((resolve) => resolve(this.info.user.refresh()));
          case "userToken":
            return new Promise((resolve) =>
              resolve(this.access.user.refresh())
            );
          case "pageId":
            return new Promise((resolve) => resolve(this.info.page.refresh()));
          case "pageToken":
            return new Promise((resolve) =>
              resolve(this.access.page.refresh())
            );
          default:
            break;
        }
      }),
      ...permissions.map(
        (p) =>
          new Promise((resolve) => {
            if (p in this.scope) {
              resolve(null);
            } else {
              let message =
                `Permission '${p}' is required, but is currently missing from the permission scope. Try adding to the scope object in your config, and then refreshing your credentials (usually through the command line).\n` +
                `Some permissions require special approval from Facebook. For more information about the '${p}' permission, see https://developers.facebook.com/docs/permissions/reference/${p}`;
              switch (p) {
                case "user_posts":
                  message =
                    "Although reading user posts (even your own) is a fairly basic function, Facebook requires the 'user_posts' permission to do so, and your current scope does not include 'user_posts'.\n" +
                    "In order to add the `user_posts` permission, you must get special approval from Facebook. This is a manual process, and can take a few days to complete.\n" +
                    "You can do it by reading the instructions on their documentation, and reaching out to Facebook manually through their specified channels (usually a form you submit through their developer portal).\n" +
                    "For more information about the `user_posts` permission, and how to get it, see https://developers.facebook.com/docs/permissions/reference/user_posts\n";
                  break;
                default:
                  break;
              }
              if (warn) {
                warnConsole(message);
              } else {
                throw new UnauthorizedError(message);
              }
            }
          })
      ),
    ];
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

  async login(
    config: Authentication = DEFAULT_CONFIG
  ): Promise<{ credentials: Credentials; scope: Permissions }> {
    const writeCredentials = config.writeCredentials || writeToJSONCredentials;
    const readCredentials = config.readCredentials || readFromJSONCredentials;
    const expireTime = config.expireTime || DEFAULT_EXPIRE_TIME;

    // Permission scope check
    return this.verify(
      this.stale,
      readCredentials,
      writeCredentials,
      expireTime
    )
      .refresh(["appToken", "userId", "userToken", "pageId", "pageToken"])
      .then(() => {
        if (this.stale.length >= 1) {
          console.warn(
            "Error generating credentials, some credentials were unable to be generated: " +
              this.stale
          );
        }

        const credentials = this.credentials();
        const scope = this.scope;

        return { credentials, scope };
      });
  }

  credentials(
    options: { error: boolean; expirations: boolean; index: boolean } = {
      error: true,
      expirations: true,
      index: true,
    }
  ): Credentials {
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

    return {
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
    };
  }
}
