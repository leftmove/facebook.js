#!/usr/bin/env tsx

import { Command } from "commander";
import { render } from "ink";

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
} from "./token";
import { userIdCredential, pageIdCredential } from "./id";

import { initial, loginStart, loginSuccess } from "./components";

const program = new Command();
initial();

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
    const facebook = new Facebook({ appId, appSecret }).verifyAppCredentials();

    const appToken = await appTokenCredential(
      facebook,
      options.appToken || credentials.appToken || undefined
    );
    const userToken = await userTokenCredential(
      facebook,
      scope,
      options.userToken || credentials.userToken || undefined
    );
    const userId = await userIdCredential(
      facebook,
      options.userId || credentials.userId || undefined
    );
    const pageId = await pageIdCredential(
      facebook,
      options.pageId || credentials.pageId || undefined,
      options.pageIndex || credentials.pageIndex || undefined
    );

    const path = options.path || DEFAULT_FILE_PATH;
    writeToJSONCredentials(
      { appId, appSecret, appToken, userToken, userId, pageId },
      path
    );

    loginSuccess();
  });

program.parse();
