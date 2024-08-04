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

  constructor(config: Config = {}) {
    super(config);
  }
}
