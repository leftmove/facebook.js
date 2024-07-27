import open from "open";
import ora from "ora";
import inquirer from "inquirer";

import Client from "./wrapper";
import {
  writeToJSONCredentials,
  readFromJSONCredentials,
  DEFAULT_FILE_PATH,
} from "../credentials";
import { log, yellow, green } from "../cli/utils";
import { CredentialError, GraphError } from "../errors";
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
  read_insights: true,
  business_management: true,
};

export const DEFAULT_EXPIRE_TIME = 60;

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
  userToken?: string;
  userId?: string;
  userTokenExpires?: number;
  pageId?: string;
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
      const error = new Error();
      throw new CredentialError(
        "Empty credentials provided. App ID and App Secret are required.",
        error
      );
    }

    const appToken = config.appToken || credentials.appToken || this.appToken;
    const userToken =
      config.userToken || credentials.userToken || this.userToken;
    const userId = config.userId || credentials.userId || this.userId;
    const userTokenExpires =
      config.userTokenExpires ||
      credentials.userTokenExpires ||
      this.userTokenExpires;
    const pageToken =
      config.pageToken || credentials.pageToken || this.pageToken;
    const pageId = config.pageId || credentials.pageId || this.pageId;
    const pageIndex =
      config.pageIndex || credentials.pageIndex || this.pageIndex;
    const pageTokenExpires =
      config.pageTokenExpires ||
      credentials.pageTokenExpires ||
      this.pageTokenExpires;

    const scope = config.scope || credentials.scope || this.scope;
    const overrideLocal = config.overrideLocal || this.overrideLocal;

    this.appId = appId;
    this.appSecret = appSecret;
    this.appToken = appToken;
    this.userToken = userToken;
    this.userId = userId;
    this.userTokenExpires = userTokenExpires;
    this.pageId = pageId;
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

  verifyAppCredentials(appId: string, appSecret: string) {
    const token = ["appId", "appSecret"];
    const appAccessToken = `${appId}|${appSecret}`;

    if (appId === undefined || appSecret === undefined) {
      const error = new Error();
      throw new CredentialError("App ID and App Secret are required.", error);
    }

    this.client
      .get("debug_token", {
        input_token: appAccessToken,
        access_token: appAccessToken,
      })
      .then((data: Debug) => {
        if (data?.data?.is_valid) {
          return true;
        } else {
          this.stale = [...this.stale, ...token];
        }
      })
      .catch((e: GraphError) => {
        const data: DebugError = e.data;
        const code = data?.error?.code || 400;
        if (code === 190) {
          this.stale = [...this.stale, ...token];
        } else {
          const error = new Error();
          throw new CredentialError(
            "Error verifying app credentials.",
            error,
            e
          );
        }
      });
  }

  verifyAppToken(appToken: string) {
    const token = "appToken";

    if (appToken === undefined) {
      this.stale = [...this.stale, token];
      return;
    }

    this.client
      .get("debug_token", {
        input_token: appToken,
        access_token: `${this.appId}|${this.appSecret}`,
      })
      .then((data: Debug) => {
        if (data?.data?.is_valid) {
          return true;
        } else {
          this.stale = [...this.stale, token];
        }
      })
      .catch((e: GraphError) => {
        const data: DebugError = e.data;
        const code = data?.error?.code || 400;
        if (code === 190) {
          this.stale = [...this.stale, token];
        } else {
          const error = new Error();
          throw new CredentialError("Error verifying app token.", error, e);
        }
      });
  }

  verifyUserCredentials(userToken: string, userTokenExpires: number) {
    const token = "userToken";

    if (userToken === undefined) {
      this.stale = [...this.stale, token];
      return;
    }

    const now = Date.now();
    if (now - userTokenExpires <= this.expireTime) {
      return;
    }

    this.client
      .get("debug_token", { input_token: userToken, access_token: userToken })
      .then((data: Debug) => {
        if (data?.data?.is_valid) {
          return true;
        } else {
          this.stale = [...this.stale, token];
        }
      })
      .catch((e: GraphError) => {
        const data: DebugError = e.data;
        const code = data?.error?.code || 400;
        if (code === 190) {
          this.stale = [...this.stale, token];
        } else {
          const error = new Error();
          throw new CredentialError("Error verifying user token.", error, e);
        }
      });
  }

  verifyUserId(userId: string, userToken: string) {
    const token = "userId";

    if (userToken === undefined || userId === undefined) {
      this.stale = [...this.stale, token];
      return;
    }

    this.client
      .get(userId, { access_token: userToken })
      .then((data: Debug) => {
        if (data?.data?.is_valid) {
          return true;
        } else {
          this.stale = [...this.stale, token];
        }
      })
      .catch((e: GraphError) => {
        const data: DebugError = e.data;
        const code = data?.error?.code || 400;
        if (code === 190) {
          this.stale = [...this.stale, token];
        } else {
          const error = new Error();
          throw new CredentialError("Error verifying user ID.", error, e);
        }
      });
  }

  verifyPageId(pageId: string, pageToken: string) {
    const token = "pageId";

    if (pageToken === undefined || pageId === undefined) {
      this.stale = [...this.stale, token];
      return;
    }

    this.client
      .get(pageId, { access_token: pageToken })
      .then((data: Debug) => {
        if (data?.data?.is_valid) {
          return true;
        } else {
          this.stale = [...this.stale, token];
        }
      })
      .catch((e: GraphError) => {
        const data: DebugError = e.data;
        const code = data?.error?.code || 400;
        if (code === 190) {
          this.stale = [...this.stale, token];
        } else {
          const error = new Error();
          throw new CredentialError("Error verifying page ID.", error, e);
        }
      });
    return true;
  }

  verifyPageCredentials(pageToken: string, pageTokenExpires: number) {
    const token = "pageToken";

    if (pageToken === undefined) {
      this.stale = [...this.stale, token];
      return;
    }

    const now = Date.now();
    if (now - pageTokenExpires <= this.expireTime) {
      return;
    }

    this.client
      .get("debug_token", { input_token: pageToken, access_token: pageToken })
      .then((data: Debug) => {
        if (data?.data?.is_valid) {
          return true;
        } else {
          this.stale = [...this.stale, token];
        }
      })
      .catch((e: GraphError) => {
        const data: DebugError = e.data;
        const code = data?.error?.code || 400;
        if (code === 190) {
          this.stale = [...this.stale, token];
        } else {
          const error = new Error();
          throw new CredentialError("Error verifying page token.", error, e);
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
      this.verifyAppToken(credentials.appToken as string);
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
        credentials.userToken as string
      );
    }

    if ("pageToken" in emptyCredentials === true) {
      this.verifyPageCredentials(
        credentials.pageToken as string,
        credentials.pageTokenExpires as number
      );
    }

    if ("pageId" in emptyCredentials === true) {
      this.verifyPageId(
        credentials.pageId as string,
        credentials.pageToken as string
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
    this.client
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
        });
      })
      .catch((e: GraphError) => {
        const error = new Error();
        throw new CredentialError("Error verifying page token.", error, e);
      });
  }

  refreshUserToken(appId: string, appSecret: string, scope: Permissions) {
    if (appId == "" || appSecret === "") {
      throw new CredentialError(
        "App ID and App Secret are required to generate user tokens."
      );
    }

    const port = 2279;
    const host = "localhost";
    const redirect = new URL(`http://${host}:${port}/login`);

    const oauth =
      "https://facebook.com/v20.0/dialog/oauth?" +
      new URLSearchParams({
        client_id: this.appId,
        response_type: "code",
        auth_type: "rerequest",
        scope: Object.keys(scope).join(","),
        redirect_uri: redirect.href,
      });

    const handleOAuth = () => {
      const spinner = ora({
        text: "Attempting OAuth in default browser ...",
        spinner: "dots",
        color: "white",
      }).start();

      open(oauth);
      const client = new Client();

      client.wait(2500).then(() => {
        spinner.stop();
        log("-", "Attempted to open OAuth in default browser.", yellow);
        log(
          "!",
          `If OAuth did not open, you can visit the link manually:\n${oauth}`,
          yellow
        );
      });
    };

    this.client
      .server("/login", handleOAuth, { host, port })
      .then((query: any) => {
        const client = new Client();
        const code = query.code;

        const spinner = ora({
          text: "Authenticating user token ...",
          spinner: "dots",
          color: "white",
        }).start();
        interface Data {
          access_token: string;
          token_type: string;
          expires_in: number;
        }

        client
          .get("oauth/access_token", {
            code,
            client_id: appId,
            client_secret: appSecret,
            redirect_uri: redirect.href,
          })
          .then((data: Data) => {
            spinner.stop();
            log("✓", "Successfully authenticated user token.", green);

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
            throw new CredentialError("Error getting user token.", error, e);
          });
      })
      .catch((e: GraphError) => {
        const error = new Error();
        throw new CredentialError("Error getting user token.", error, e);
      });
  }

  refreshUserId(appId: string, appSecret: string, userToken: string) {
    interface Data {
      name: string;
      id: string;
    }
    this.client
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
        });
      })
      .catch((e: GraphError) => {
        const error = new Error();
        throw new CredentialError("Error verifying page token.", error, e);
      });
  }

  refreshPageId(
    appId: string,
    appSecret: string,
    userId: string,
    userToken: string,
    pageIndex: number | null = null
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
    this.client
      .get(`${userId}/accounts`, {
        access_token: userToken,
      })
      .then((data: Data) => {
        const pageCount = data.data.length;
        if (pageCount === 0) {
          throw new Error("No pages found.");
        }
        if (pageCount === 1 || pageIndex === null) {
          pageIndex = 0;
        }

        if (pageIndex === null) {
          throw new Error("Invalid page index selected.");
        }

        const pageId = data.data[pageIndex].id;
        this.pageId = pageId;
        this.writeCredentials({
          appId,
          appSecret,
          pageId,
        });
      })
      .catch((e: any) => {
        if (e instanceof GraphError) {
          const error = new Error();
          throw new CredentialError("Error verifying page token.", error, e);
        } else {
          throw new CredentialError("Error verifying page token.", e);
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
    this.client
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
        });
      })
      .catch((e: GraphError) => {
        const error = new Error();
        throw new CredentialError("Error verifying page token.", error, e);
      });
  }

  refresh(
    credentials: Array<string> = this.stale,
    scope: Permissions = DEFAULT_SCOPE
  ) {
    credentials.map((c) => {
      switch (c) {
        case "appToken":
          this.refreshAppToken(this.appId, this.appSecret);
          break;
        case "userToken":
          this.refreshUserToken(this.appId, this.appSecret, scope);
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
            this.userToken
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

  authenticate(config: Authentication = DEFAULT_CONFIG) {
    const scope = config.scope || this.scope;
    const writeCredentials = config.writeCredentials || writeToJSONCredentials;
    const readCredentials = config.readCredentials || readFromJSONCredentials;
    const expireTime = config.expireTime || DEFAULT_EXPIRE_TIME;

    this.verify(this.stale, readCredentials, writeCredentials, expireTime);
    this.refresh(this.stale, scope);
    this.verify(this.stale, readCredentials, writeCredentials, expireTime);

    if (this.stale.length > 0) {
      console.warn(
        "Warning: error refreshing credentials, some credentials were unable to be refreshed.",
        this.stale
      );
    }

    return this;
  }
}
