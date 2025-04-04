#!/usr/bin/env tsx

import { Command } from "commander";

import Facebook from "../index";
import {
  readFromJSONCredentials,
  writeToJSONCredentials,
} from "../credentials";
import { DEFAULT_FILE_PATH, DEFAULT_SCOPE } from "../index";

import {
  appCredentials,
  appTokenCredential,
  userTokenCredential,
  pageTokenCredential,
} from "./token";
import { userIdCredential, pageIdCredential } from "./id";

import { App, LoginStart, ReloginStart, LoginSuccess } from "./components";

const program = new Command();

program
  .name("cli-facebook.js")
  .description("The CLI tool for facebook.js and Facebook authentication.");

program
  .command("login")
  .description("Authenticate Facebook credentials.")
  .option("--appId", "Facebook App ID.")
  .option("--appSecret", "Facebook App Secret.")
  .option("--appToken", "Facebook App Token.")
  .option("--userToken", "Facebook User Token.")
  .option("--userId", "Facebook User ID.")
  .option("--pageId", "Facebook Page ID.")
  .option("--pageIndex", "Facebook Page Index.")
  .option("--pageToken", "Facebook Page Token.")
  .option("--scope", "Facebook permissions scope, given as a JSON string.")
  .option("--credentials", "Facebook credentials.", DEFAULT_FILE_PATH)
  .option("--path", "Path to the credentials file.")
  .action(async (options) => {
    const credentials = readFromJSONCredentials(options.credentials);
    const scope =
      (options.scope ? JSON.parse(options.scope) : undefined) ||
      (credentials?.scope &&
      Object.keys(credentials.scope as Object).length === 0
        ? undefined
        : credentials.scope) ||
      DEFAULT_SCOPE;

    const app = new App();
    app.render(LoginStart);

    const { appId, appSecret } = await appCredentials(
      options.appId || credentials.appId || undefined,
      options.appSecret || credentials.appSecret || undefined
    );

    let appToken = options.appToken || credentials.appToken || undefined;
    let userToken = options.userToken || credentials.userToken || undefined;
    let userId = options.userId || credentials.userId || undefined;
    let pageId = options.pageId || credentials.pageId || undefined;
    let pageIndex = options.pageIndex || credentials.pageIndex || undefined;
    let pageToken = options.pageToken || credentials.pageToken || undefined;

    const facebook = new Facebook({
      id: appId,
      secret: appSecret,
      appToken,
      userToken,
      userId,
      pageId,
      pageToken,
      pageIndex,
      scope,
    });

    appToken = await appTokenCredential(facebook, app, appToken);
    userToken = await userTokenCredential(facebook, app, scope, userToken);
    userId = await userIdCredential(facebook, app, userId);
    pageId = await pageIdCredential(facebook, app, pageId, pageIndex);
    pageToken = await pageTokenCredential(facebook, app, pageToken);

    const path = options.path || DEFAULT_FILE_PATH;
    writeToJSONCredentials(
      { appId, appSecret, appToken, userToken, userId, pageId, pageToken },
      path
    );

    app.render(LoginSuccess);
  });

program
  .command("relogin")
  .description("Authenticate Facebook credentials.")
  .option("--appId", "Facebook App ID.")
  .option("--appSecret", "Facebook App Secret.")
  .option("--appToken", "Facebook App Token.")
  .option("--userToken", "Facebook User Token.")
  .option("--userId", "Facebook User ID.")
  .option("--pageId", "Facebook Page ID.")
  .option("--pageIndex", "Facebook Page Index.")
  .option("--pageToken", "Facebook Page Token.")
  .option("--scope", "Facebook permissions scope, given as a JSON string.")
  .option("--credentials", "Facebook credentials.", DEFAULT_FILE_PATH)
  .option("--path", "Path to the credentials file.")
  .action(async (options) => {
    const credentials = readFromJSONCredentials(options.credentials);
    const scope =
      (options.scope ? JSON.parse(options.scope) : undefined) ||
      (Object.keys(credentials.scope as Object).length === 0
        ? undefined
        : credentials.scope) ||
      DEFAULT_SCOPE;

    const app = new App();
    app.render(ReloginStart);

    const { appId, appSecret } = await appCredentials(
      options.appId || credentials.appId || undefined,
      options.appSecret || credentials.appSecret || undefined
    );

    let appToken = undefined;
    let userToken = undefined;
    let userId = undefined;
    let pageId = undefined;
    let pageIndex = undefined;
    let pageToken = undefined;

    const facebook = new Facebook({
      id: appId,
      secret: appSecret,
      appToken,
      userToken,
      userId,
      pageId,
      pageToken,
      pageIndex,
      scope,
    });

    appToken = await appTokenCredential(facebook, app, appToken);
    userToken = await userTokenCredential(facebook, app, scope, userToken);
    userId = await userIdCredential(facebook, app, userId);
    pageId = await pageIdCredential(facebook, app, pageId, pageIndex);
    pageToken = await pageTokenCredential(facebook, app, pageToken);

    const path = options.path || DEFAULT_FILE_PATH;
    writeToJSONCredentials(
      { appId, appSecret, appToken, userToken, userId, pageId, pageToken },
      path
    );

    app.render(LoginSuccess);
  });

program.parse();
