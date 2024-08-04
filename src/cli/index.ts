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

import { loginStart, loginSuccess } from "./components";

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
  .option(
    "--scope",
    "Facebook permissions scope, given as a JSON string.",
    JSON.stringify(DEFAULT_SCOPE)
  )
  .option("--credentials", "Facebook credentials.", DEFAULT_FILE_PATH)
  .option("--path", "Path to the credentials file.")
  .action(async (options) => {
    const credentials = readFromJSONCredentials(options.credentials);
    const scope =
      credentials.scope || JSON.parse(options.scope || "{}") || undefined;

    loginStart();

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
      appId,
      appSecret,
      ...(appToken ? appToken : null),
      ...(userToken ? userToken : null),
      ...(userId ? userId : null),
      ...(pageId ? pageId : null),
      ...(pageIndex ? pageIndex : null),
      ...(pageToken ? pageToken : null),
      scope,
    });

    appToken = await appTokenCredential(facebook, appToken);
    userToken = await userTokenCredential(facebook, scope, userToken);
    userId = await userIdCredential(facebook, userId);
    pageId = await pageIdCredential(facebook, pageId, pageIndex);
    pageToken = await pageTokenCredential(facebook, pageToken);

    const path = options.path || DEFAULT_FILE_PATH;
    writeToJSONCredentials(
      { appId, appSecret, appToken, userToken, userId, pageId, pageToken },
      path
    );

    loginSuccess();
  });

program
  .command("relogin")
  .description(
    "Authenticate Facebook credentials, regardless of if they are already there. Reloads ALL credentials"
  )
  .option("--appId", "Facebook App ID.")
  .option("--appSecret", "Facebook App Secret.")
  .option(
    "--scope",
    "Facebook permissions scope, given as a JSON string.",
    JSON.stringify(DEFAULT_SCOPE)
  )
  .option("--credentials", "Facebook credentials.", DEFAULT_FILE_PATH)
  .option("--path", "Path to the credentials file.")
  .action(async (options) => {
    const credentials = readFromJSONCredentials(options.credentials);
    const scope =
      credentials.scope || JSON.parse(options.scope || "{}") || undefined;

    loginStart();

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
      appId,
      appSecret,
      appToken,
      userToken,
      userId,
      pageId,
      pageIndex,
      pageToken,
      scope,
    });

    appToken = await appTokenCredential(facebook, appToken);
    userToken = await userTokenCredential(facebook, scope, userToken);
    userId = await userIdCredential(facebook, userId);
    pageId = await pageIdCredential(facebook, pageId, pageIndex);
    pageToken = await pageTokenCredential(facebook, pageToken);

    const path = options.path || DEFAULT_FILE_PATH;
    writeToJSONCredentials(
      {
        appId,
        appSecret,
        appToken,
        userToken,
        userId,
        pageIndex,
        pageId,
        pageToken,
      },
      path
    );

    loginSuccess();
  });

program.parse();
