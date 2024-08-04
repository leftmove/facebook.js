import assert from "node:assert";
import url from "node:url";

import http from "http";
import open from "open";

import chalk from "chalk";
import ora from "ora";

import Client from "../api/client";
import { CredentialError } from "../errors";
import {
  writeToJSONCredentials,
  readFromJSONCredentials,
} from "../credentials";
import type { writeCredentials, readCredentials } from "../credentials";
import type { Permissions } from "../api";
import type { Credentials } from "../credentials";

export interface Config {
  appId?: string;
  appSecret?: string;

  appToken?: string;
  userToken?: string;
  userTokenExpires?: number;
  pageToken?: string;
  pageTokenExpires?: number;

  scope?: Permissions;
  writeCredentials?: writeCredentials;
  readCredentials?: readCredentials;
  overrideLocal?: boolean;
}

export class Facebook {
  client = new Client();

  appId: string | null = null;
  appSecret: string | null = null;

  appToken: string | null = null;
  userToken?: string | null = null;
  userTokenExpires?: number | null = null;
  pageToken?: string | null = null;
  pageTokenExpires?: number | null = null;

  writeCredentials: writeCredentials = writeToJSONCredentials;
  readCredentials: readCredentials = readFromJSONCredentials;
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
    const readCredentials = config.readCredentials || this.readCredentials;
    const credentials = readCredentials();

    const appId = config.appId || credentials.appId || this.appId;
    const appSecret =
      config.appSecret || credentials.appSecret || this.appSecret;

    if (appId === null || appSecret === null) {
      throw new CredentialError(
        "Empty credentials provided. App ID and App Secret are required."
      );
    }

    const appToken = config.appToken || credentials.appToken || this.appToken;
    const userToken =
      config.userToken || credentials.userToken || this.userToken;
    const userTokenExpires =
      config.userTokenExpires ||
      credentials.userTokenExpires ||
      this.userTokenExpires;
    const pageToken =
      config.pageToken || credentials.pageToken || this.pageToken;
    const pageTokenExpires =
      config.pageTokenExpires ||
      credentials.pageTokenExpires ||
      this.pageTokenExpires;

    const scope = config.scope || credentials.scope || this.scope;
    const writeCredentials = config.writeCredentials || this.writeCredentials;
    const overrideLocal = config.overrideLocal || this.overrideLocal;

    this.appId = appId;
    this.appSecret = appSecret;
    this.appToken = appToken;
    this.userToken = userToken;
    this.userTokenExpires = userTokenExpires;
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
        userTokenExpires,
        pageToken,
        pageTokenExpires,
        scope,
      });
    }
  }

  async updateCredentials(credentials: Credentials) {
    const appId = credentials.appId || this.appId;
    const appSecret = credentials.appSecret || this.appSecret;
    const appToken = credentials.appToken || this.appToken;
    const userToken = credentials.userToken || this.userToken;
    const userTokenExpires =
      credentials.userTokenExpires || this.userTokenExpires;
    const pageToken = credentials.pageToken || this.pageToken;
    const pageTokenExpires =
      credentials.pageTokenExpires || this.pageTokenExpires;
    const scope = credentials.scope || this.scope;

    this.appId = appId;
    this.appSecret = appSecret;
    this.appToken = appToken;
    this.userToken = userToken;
    this.userTokenExpires = userTokenExpires;
    this.pageToken = pageToken;
    this.pageTokenExpires = pageTokenExpires;
    this.scope = scope;

    this.writeCredentials({
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

  async getAppToken() {
    // await this.refreshAppToken();
    return this.appToken;
  }

  async verifyAppToken(token: string) {
    try {
      await this.client.get("debug_token", {
        input_token: token,
        access_token: token,
      });
      return true;
    } catch (error: any) {
      if (error.status === 190 || error.data.is_valid === false) {
        return false;
      } else {
        throw new CredentialError(
          "Bad credentials. Please make an issue on GitHub if this problem persists.",
          error
        );
      }
    }
  }

  async refreshAppToken() {
    const appToken = this.appToken;

    if (appToken) {
      const validation = await this.verifyAppToken(appToken);
      if (validation) {
        return appToken;
      }
    }

    const data = await this.client.get("oauth/access_token", {
      client_id: this.appId,
      client_secret: this.appSecret,
      grant_type: "client_credentials",
    });
    const accessToken = data.access_token;

    this.writeCredentials({
      appToken: accessToken,
    });
  }

  async getUserToken() {
    await this.refreshUserToken();
    return this.userToken;
  }

  async verifyUserToken(token: string) {
    try {
      await this.client.get("me", { access_token: token });
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
    const userToken = this.userToken;
    const userTokenExpires = this.userTokenExpires;

    const now = Date.now();
    if (userTokenExpires && now - userTokenExpires <= 60 * 10) {
      return userToken;
    }

    if (userToken) {
      const validation = await this.verifyUserToken(userToken);
      if (validation) {
        return userToken;
      }
    }

    const appId = this.appId;
    const appSecret = this.appSecret;
    if (appId === null || appSecret === null) {
      throw new CredentialError(
        "App ID and App Secret are required to generate user tokens."
      );
    }

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
            const accessToken = data.access_token;
            const expireTime = data.expires_in;

            this.writeCredentials({
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
        client_id: appId,
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

  async getPageToken() {
    await this.refreshPageToken();
    return this.pageToken;
  }

  async verifyPageToken(token: string) {
    try {
      await this.client.get("me", { access_token: token });
      return true;
    } catch (error: any) {
      if (error.status === 190) {
        return false;
      } else {
        throw new CredentialError(
          "Bad credentials. Please make an issue on GitHub if this problem persists.",
          error
        );
      }
    }
  }

  async refreshPageToken() {
    const userToken = await this.getUserToken();
  }
}
