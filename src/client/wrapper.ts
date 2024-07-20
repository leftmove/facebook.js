import assert from "node:assert";
import url from "node:url";

import http from "http";
import open from "open";

import chalk from "chalk";
import ora from "ora";

import Client from "../api/client";
import { CredentialError } from "../errors";
import { writeToJSONConfig, readFromJSONConfig } from "../credentials";
import type { AuthConfig } from "../credentials";

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

export type writeAuthConfig = (...args: any) => Promise<void>;
export type readAuthConfig = (...args: any) => Promise<AuthConfig>;

export interface Config extends AuthConfig {
  scope?: Permissions;
  writeAuthConfig?: writeAuthConfig;
  readAuthConfig?: readAuthConfig;
}

class Credentials {
  appId: string;
  appSecret: string;

  constructor(appId: string, appSecret: string) {
    this.appId = appId;
    this.appSecret = appSecret;
  }

  appToken?: string;
  appTokenExpires?: number;
  userToken?: string;
  userTokenExpires?: number;
  pageToken?: string;
  pageTokenExpires?: number;
}

export class Facebook extends Credentials {
  client = new Client();

  writeAuthConfig: writeAuthConfig = writeToJSONConfig;
  readAuthConfig: readAuthConfig = readFromJSONConfig;

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
    super(appId, appSecret);
    this.appId = appId;
    this.appSecret = appSecret;
  }

  async config() {
    return await this.readAuthConfig();
  }

  async refreshAppInfo() {
    const authConfig = await this.readAuthConfig();
    this.appId = this.appId || authConfig.appId;
    this.appSecret = this.appSecret || authConfig.appSecret;
  }

  async getAppToken() {
    return await this.client.get("oauth/access_token", {
      client_id: this.appId,
      client_secret: this.appSecret,
      grant_type: "client_credentials",
    });
  }

  async getUserToken() {
    await this.refreshUserToken();
    const authConfig = await this.readAuthConfig();
    return authConfig.userToken;
  }

  async verifyUserToken() {
    try {
      await this.client.get("me", { access_token: this.userToken });
      return true;
    } catch (error: any) {
      if (error.status === 463 || error.status === 2500) {
        return false;
      } else {
        throw new CredentialError(
          "Bad credentials. Please make an issue on GitHub if this problem persists.",
          error
        );
      }
    }
  }

  async refreshUserToken() {
    const authConfig = await this.readAuthConfig();
    const userToken = authConfig.userToken;

    const userTokenExpires = authConfig.userTokenExpires;
    const now = Date.now();
    if (userTokenExpires && now - userTokenExpires <= 60 * 10) {
      return userToken;
    }

    const validation = await this.verifyUserToken();
    if (validation) {
      return userToken;
    }

    await this.refreshAppInfo();

    const port = 2279;
    const host = "localhost";
    const redirect = new URL(`http://${host}:${port}/login`);

    const server = http.createServer(
      async (req: http.IncomingMessage, res: http.ServerResponse) => {
        assert(req.url, "This request doesn't have a URL");
        const { pathname, query } = url.parse(req.url, true);

        switch (pathname) {
          case "/login":
            const code = query.code;
            const data = await this.client
              .get("oauth/access_token", {
                code,
                client_id: this.appId,
                client_secret: this.appSecret,
                redirect_uri: redirect.href,
              })
              .catch((e: any) => {
                const error = new CredentialError(
                  "Error getting user token.",
                  e
                );
                throw error;
              });
            console.log(data);
            const accessToken = data.access_token;
            const expireTime = data.expires_in;

            await this.writeAuthConfig({
              userToken: accessToken,
              userTokenExpires: expireTime,
            });
            console.log(chalk.green("✓"), "Successfully authenticated!");

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
        scope: Object.keys(this.scope).join(","),
        redirect_uri: redirect.href,
      });
    server.listen(port, host);

    const spinner = ora({
      text: "Attempting OAuth in default browser",
      spinner: "dots",
      color: "white",
    }).start();
    await open(oauth);
    setTimeout(() => {
      spinner.stop();
      console.log(
        chalk.yellow("!"),
        "If OAuth did not open, visit the link manually:",
        chalk.blue(oauth)
      );
    }, 1000);
  }

  async refreshPageToken() {
    const userToken = await this.getUserToken();
  }
}
