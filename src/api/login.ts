import http from "http";
import assert from "node:assert";
import url from "node:url";

import open from "open";
import chalk from "chalk";
import ora from "ora";

import Client from "./wrapper";
import {
  writeToJSONCredentials,
  readFromJSONCredentials,
  DEFAULT_FILE_PATH,
} from "../credentials";
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
  data: Data;
}

export interface Data {
  app_id: string;
  type: string;
  application: string;
  is_valid: boolean;
  scopes: any[];
}

export interface DebugError {
  data: DataError;
}

export interface DataError {
  error: Error;
  is_valid: boolean;
  scopes: any[];
}

export interface Error {
  code: number;
  message: string;
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
  pageToken?: string;
  pageId?: string;
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
    this.pageToken = pageToken;
    this.pageId = pageId;
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
        userTokenExpires,
        pageToken,
        pageTokenExpires,
        scope,
      });
    }
  }

  verifyAppCredentials(appId: string, appSecret: string) {
    const token = ["appId", "appSecret"];
    const appAccessToken = `${appId}|${appSecret}`;
    console.log(token);
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
        const code = data?.data?.error?.code || 400;
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
    console.log(token);
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
        const code = data?.data?.error?.code || 400;
        if (code === 190) {
          this.stale = [...this.stale, token];
        } else {
          const error = new Error();
          throw new CredentialError("Error verifying app token.", error, e);
        }
      });
  }

  verifyUserId(userId: string, userToken: string) {
    const token = "userId";
    console.log(token);
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
        const code = data?.data?.error?.code || 400;
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
    console.log(token);
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
        const code = data?.data?.error?.code || 400;
        if (code === 190) {
          this.stale = [...this.stale, token];
        } else {
          const error = new Error();
          throw new CredentialError("Error verifying page ID.", error, e);
        }
      });
    return true;
  }

  verifyUserCredentials(userToken: string, userTokenExpires: number) {
    const token = "userToken";
    console.log(token);
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
        const code = data?.data?.error?.code || 400;
        if (code === 190) {
          this.stale = [...this.stale, token];
        } else {
          const error = new Error();
          throw new CredentialError("Error verifying user token.", error, e);
        }
      });
  }

  verifyPageCredentials(pageToken: string, pageTokenExpires: number) {
    const token = "pageToken";
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
        const code = data?.data?.error?.code || 400;
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

    if ("appToken" in emptyCredentials === false) {
      this.verifyAppToken(credentials.appToken as string);
    }

    if ("userToken" in emptyCredentials === false) {
      this.verifyUserCredentials(
        credentials.userToken as string,
        credentials.userTokenExpires as number
      );
    }

    if ("userId" in emptyCredentials === false) {
      this.verifyUserId(
        credentials.userId as string,
        credentials.userToken as string
      );
    }

    if ("pageToken" in emptyCredentials === false) {
      this.verifyUserCredentials(
        credentials.pageToken as string,
        credentials.pageTokenExpires as number
      );
    }

    if ("pageId" in emptyCredentials === false) {
      this.verifyPageId(
        credentials.pageId as string,
        credentials.pageToken as string
      );
    }

    if (new Set(this.stale).size !== this.stale.length) {
      throw new Error("this.stale contains duplicates");
    }

    this.stale = this.stale.sort((a, b) => {
      const indexA = credentialOptions.indexOf(a);
      const indexB = credentialOptions.indexOf(b);
      return indexA - indexB;
    });
    return this;
  }

  refreshAppToken(appId: string, appSecret: string) {
    const data = this.client.get("oauth/access_token", {
      client_id: appId,
      client_secret: appSecret,
      grant_type: "client_credentials",
    });
    const accessToken = data.access_token;
    this.appToken = accessToken;
    this.writeCredentials({
      appId: appId,
      appSecret: appSecret,
      appToken: accessToken,
    });
  }

  async refreshUserToken(appId: string, appSecret: string, scope: Permissions) {
    if (appId == "" || appSecret === "") {
      throw new CredentialError(
        "App ID and App Secret are required to generate user tokens."
      );
    }

    const port = 2279;
    const host = "localhost";
    const redirect = new URL(`http://${host}:${port}/login`);

    const server = http.createServer(
      (req: http.IncomingMessage, res: http.ServerResponse) => {
        assert(req.url, "This request doesn't have a URL");
        const { pathname, query } = url.parse(req.url, true);

        switch (pathname) {
          case "/login":
            const code = query.code;
            const data = this.client
              .get("oauth/access_token", {
                code,
                client_id: appId,
                client_secret: appSecret,
                redirect_uri: redirect.href,
              })
              .catch((e: any) => {
                const error = new CredentialError(
                  "Error getting user token.",
                  e
                );
                throw error;
              });

            console.log(chalk.green("✓"), "Successfully authenticated!");

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

            res.writeHead(200);
            res.end(
              "Success! Your Facebook instance has been authenticated, you may now close this tab.",
              () => server.close()
            );

            break;
          default:
            res.writeHead(404);
            res.end("not found");
        }
      }
    );

    const oauth =
      "https://facebook.com/v20.0/dialog/oauth?" +
      new URLSearchParams({
        client_id: this.appId,
        response_type: "code",
        auth_type: "rerequest",
        scope: Object.keys(scope).join(","),
        redirect_uri: redirect.href,
      });
    server.listen(port, host);

    const spinner = ora({
      text: "Attempting OAuth in default browser",
      spinner: "dots",
      color: "white",
    }).start();
    open(oauth);
    setTimeout(() => {
      spinner.stop();
      console.log(
        chalk.yellow("!"),
        "If OAuth did not open, visit the link manually:",
        chalk.blue(oauth)
      );
    }, 1000);
  }

  refreshUserId(appId: string, appSecret: string, userToken: string) {
    const data = this.client.get("me", {
      access_token: userToken,
    });
    const userId = data.id;
    this.userId = userId;
    this.writeCredentials({
      appId,
      appSecret,
      userId,
    });
  }

  refreshPageId(
    appId: string,
    appSecret: string,
    userId: string,
    userToken: string,
    pageIndex: number = 0
  ) {
    const data = this.client.get(`${userId}/accounts`, {
      access_token: userToken,
    });
    const pageId = data.data[pageIndex].id;
    this.pageId = pageId;
    this.writeCredentials({
      appId,
      appSecret,
      pageId,
    });
  }

  refreshPageToken(
    appId: string,
    appSecret: string,
    pageId: string,
    userToken: string
  ) {
    const data = this.client.get(`${pageId}`, {
      access_token: userToken,
      fields: "access_token",
    });
    const accessToken = data.access_token;
    this.pageToken = accessToken;
    this.writeCredentials({
      appId,
      appSecret,
      pageToken: accessToken,
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
              "Error getting page ID, user ID and user token are required first.",
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
  }
}
