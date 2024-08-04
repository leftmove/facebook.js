#!/usr/bin/env tsx

import { Command } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";

import Facebook from "../index";
import { DEFAULT_FILE_PATH, DEFAULT_SCOPE } from "../index";
import {
  readFromJSONCredentials,
  writeToJSONCredentials,
} from "../credentials";
import { centerText, log, reset } from "./utils";

const program = new Command();

console.log("\n");
const initalization = centerText(
  chalk.blue("--------------") +
    chalk.bold(" facebook.js ") +
    chalk.blue("--------------")
);
console.log(initalization);
console.log("\n");

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
  .action((options) => {
    const credentials = readFromJSONCredentials(options.credentials);
    const scope =
      credentials.scope || JSON.parse(options.scope || "{}") || null;

    let appId = options.appId || credentials.appId || null;
    let appSecret = options.appSecret || credentials.appSecret || null;

    log("-", "Logging In ...", reset);

    // App ID and App Secret
    if (appId === null || appSecret === null) {
      const questions: any = [
        {
          type: "input",
          name: "appId",
          message: "Enter your Facebook App ID:",
        },
        {
          type: "password",
          name: "appSecret",
          message: "Enter your Facebook App Secret:",
        },
      ];
      inquirer.prompt(questions).then((answers) => {
        const { appId: newAppId, appSecret: newAppSecret } = answers;
        appId = newAppId;
        appSecret = newAppSecret;
      });
    }

    const facebook = new Facebook({ appId, appSecret });
    facebook.verifyAppCredentials(appId, appSecret);

    // App Token
    let spinner = ora({
      text: "Authenticating App Token ...",
      spinner: "dots",
      color: "white",
    }).start();
    let appToken = options.appToken || credentials.appToken || null;
    if (appToken === null) {
      facebook.refreshAppToken(appId, appSecret);
      appToken = facebook.appToken;
    }
    facebook.verifyAppToken(appToken);
    spinner.succeed("App Token Authenticated.");

    // User Token
    spinner = ora({
      text: "Authenticating User Token ...",
      spinner: "dots",
      color: "white",
    }).start();
    let userToken = options.userToken || credentials.userToken || null;
    if (userToken === null) {
      facebook.refreshUserToken(appId, appSecret, scope);
      userToken = facebook.userToken;
    }
    facebook.verifyUserCredentials(userToken, Infinity);
    spinner.succeed("User Token Authenticated.");

    // User ID
    spinner = ora({
      text: "Authenticating User ID ...",
      spinner: "dots",
      color: "white",
    }).start();
    let userId = options.userId || credentials.userId || null;
    if (userId === null) {
      facebook.refreshUserId(appId, appSecret, userToken);
      userId = facebook.userId;
    }
    facebook.verifyUserId(userId, userToken);
    spinner.succeed("User ID Authenticated.");

    // Page ID
    let pageIndex = options.pageIndex || credentials.pageIndex || null;
    if (pageIndex === null) {
      const data: any = facebook.client.get(`${userId}/accounts`, {
        access_token: userToken,
      });
      const questions: any = [
        {
          type: "list",
          name: "page",
          message: "Select a Page:",
          choices: data.data.map((d: any, i: number) => {
            return {
              name: `(${i}):\n  ${d.name}\n  ${d.id}\n  ${
                d.category
              }\n    ${d.tasks.join(",\n    ")}`,
              value: i,
            };
          }),
        },
      ];
      inquirer.prompt(questions).then((answers: any) => {
        const { page } = answers;
        pageIndex = page;
      });
    }

    spinner = ora({
      text: "Authenticating Page ID ...",
      spinner: "dots",
      color: "white",
    }).start();

    let pageId = options.pageId || credentials.pageId || null;
    if (pageId === null) {
      facebook.refreshPageId(appId, appSecret, userToken, pageIndex);
      pageId = facebook.pageId;
    }
  });

program.parse();
