import ora from "ora";
import inquirer from "inquirer";

import Facebook from "../index";
import { CredentialError } from "../index";
import type { Permissions } from "../index";

export async function appCredentials(
  appId: string | null,
  appSecret: string | null
) {
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
    await inquirer.prompt(questions).then((answers) => {
      const { appId: newAppId, appSecret: newAppSecret } = answers;
      appId = newAppId;
      appSecret = newAppSecret;
    });
  }

  if (appId === null || appSecret === null) {
    throw new CredentialError("Invalid app credentials.");
  }

  return { appId, appSecret };
}

export async function appTokenCredential(
  facebook: Facebook,
  appToken: string | undefined
) {
  if (appToken === undefined) {
    const spinner = ora({
      text: "Authenticating App Token ...",
      spinner: "dots",
      color: "white",
    }).start();

    const appId = facebook.appId;
    const appSecret = facebook.appSecret;

    facebook.refreshAppToken(appId, appSecret).verifyAppToken();
    spinner.succeed("App Token Authenticated.");

    return facebook.appToken;
  } else {
    facebook.verifyAppToken(appToken);
    return appToken;
  }
}

export async function userTokenCredential(
  facebook: Facebook,
  scope: Permissions,
  userToken: string | undefined
) {
  if (userToken === undefined) {
    const spinner = ora({
      text: "Authenticating User Token ...",
      spinner: "dots",
      color: "white",
    }).start();

    const appId = facebook.appId;
    const appSecret = facebook.appSecret;

    facebook.refreshUserToken(appId, appSecret, scope).verifyUserCredentials();
    spinner.succeed("User Token Authenticated.");

    return facebook.userToken;
  } else {
    facebook.verifyUserCredentials(userToken, Infinity);
    return userToken;
  }
}
