import assert from "node:assert";
import url from "node:url";

import http from "http";
import open from "open";

import chalk from "chalk";
import ora from "ora";

const FACEBOOK_GRAPH_API = "https://graph.facebook.com/v20.0";

class FacebookGraphError extends Error {
  status: number = 400;
  constructor(response: Object, status: any = 400) {
    super(JSON.stringify(response));
    this.name = "FacebookGraphError";
    this.status = status;
  }
}

export class API {
  url: string = FACEBOOK_GRAPH_API;
  constructor(url: string = this.url) {
    this.url = url;
  }

  async get(path: string, params: Object = {}) {
    return fetch(
      `${this.url}/${path}${params ? "" : "?" + new URLSearchParams(params)}`
    )
      .then((r) => {
        return [r.json(), r.ok, r.status];
      })
      .then(([data, ok, status]) => {
        if (ok) {
          return data;
        } else {
          throw new FacebookGraphError(data, status);
        }
      });
  }

  async post(path: string, body: any) {
    return fetch(`${this.url}/${path}`, {
      method: "POST",
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .catch((e) => {
        const error = new FacebookGraphError(e);
        throw error;
      });
  }
}

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

export interface AuthConfig {
  appId: string;
  appSecret: string;
  userToken?: string | null;
  pageToken?: string | null;
}

export type writeAuthConfig = ({}: AuthConfig) => void;
export type readAuthConfig = () => AuthConfig;

export interface Config extends AuthConfig {
  scope?: Permissions;
  writeAuthConfig?: writeAuthConfig;
  readAuthConfig?: readAuthConfig;
}

export class Facebook {
  server = new API();
  appId: string;
  appSecret: string;
  writeAuthConfig: writeAuthConfig = () => {};
  readAuthConfig: readAuthConfig = () => ({ appId: "", appSecret: "" });
  scope: Permissions = {
    pages_manage_engagement: true,
    pages_manage_posts: true,
    pages_read_engagement: true,
    pages_read_user_content: true,
    pages_show_list: true,
    read_insights: true,
    business_management: true,
  };
  constructor(config: Config) {
    const { appId, appSecret } = config;
    this.appId = appId;
    this.appSecret = appSecret;
  }

  async getAppToken() {
    return await this.server.get("oauth/access_token", {
      client_id: this.appId,
      client_secret: this.appSecret,
      grant_type: "client_credentials",
    });
  }

  async getUserToken() {
    const authConfig = this.readAuthConfig();
    const userToken = authConfig.userToken;
    if (userToken) {
      return userToken;
    } else {
      return null;
    }
  }

  async verifyUserToken() {
    return true;
  }

  async refreshUserToken() {
    const authConfig = this.readAuthConfig();
    const userToken = authConfig.userToken;

    const validation = await this.verifyUserToken();
    if (validation) {
      return userToken;
    }

    const port = 2279;
    const host = "localhost";
    const server = http.createServer(
      async (req: http.IncomingMessage, res: http.ServerResponse) => {
        assert(req.url, "This request doesn't have a URL");
        const { pathname, query } = url.parse(req.url, true);

        switch (pathname) {
          case "/login":
            const accessToken = query.access_token;
            const expireTime = query.data_access_expiration_time;

            res.writeHead(200);
            res.end("ok", () => server.close());

            break;
          default:
            res.writeHead(404);
            res.end("not found");
        }
      }
    );

    const spinner = ora({
      text: "Attempting OAuth in browser",
      spinner: "dots",
      color: "white",
    }).start();

    const redirect = new URL(`http://${host}:${port}/login`);
    const oauth =
      "https://facebook.com/v20.0/dialog/oauth?" +
      new URLSearchParams({
        client_id: this.appId,
        response_type: "token",
        auth_type: "rerequest",
        scope: Object.keys(this.scope).join(","),
        redirect_uri: redirect.href,
      });
    server.listen(port, host);
    await open(oauth);

    setTimeout(() => {
      spinner.stop();
      console.log(
        chalk.yellow("!"),
        "If OAuth did not open, visit the link manually:",
        chalk.blue(oauth)
      );
    }, 5000);
  }

  async pageToken() {
    const userToken = this.getUserToken();
    this.server.get("me/accounts");
  }
}
