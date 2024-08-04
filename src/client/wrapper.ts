import { Client, Login } from "../api";
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
  userId?: string;
  userTokenExpires?: number;
  pageToken?: string;
  pageId?: string;
  pageTokenExpires?: number;

  scope?: Permissions;
  writeCredentials?: writeCredentials;
  readCredentials?: readCredentials;
  overrideLocal?: boolean;
}

export class Facebook extends Login {
  client = new Client();

  appId: string;
  appSecret: string;

  appToken: string | null = null;
  userToken?: string | null = null;
  userId?: string | null = null;
  userTokenExpires?: number | null = null;
  pageToken?: string | null = null;
  pageId?: string | null = null;
  pageTokenExpires?: number | null = null;

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
    const credentials = readCredentials();

    const appId = config.appId || credentials.appId || null;
    const appSecret = config.appSecret || credentials.appSecret || null;

    if (appId === null || appSecret === null) {
      throw new CredentialError(
        "Empty credentials provided. App ID and App Secret are required."
      );
    }

    super(appId, appSecret);

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
}
