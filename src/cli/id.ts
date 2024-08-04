import inquirer from "inquirer";

import Facebook from "../index";
import { CredentialError } from "../index";
import { spin } from "./components";

export async function userIdCredential(
  facebook: Facebook,
  userId: string | undefined
) {
  if (userId === undefined) {
    const spinner = spin("Authenticating User ID ...");

    const appId = facebook.appId;
    const appSecret = facebook.appSecret;
    const userToken = facebook.userToken;

    if (userToken === undefined) {
      throw new CredentialError(
        "User Token is required for User ID authentication."
      );
    }

    facebook.refreshUserId(appId, appSecret, userToken).verifyUserId();
    spinner.succeed("User ID Authenticated.");

    return facebook.userId;
  } else {
    facebook.verifyUserId();
    return userId;
  }
}

export async function pageIdCredential(
  facebook: Facebook,
  pageId: string | undefined,
  pageIndex: string | undefined
) {
  if (pageId === undefined) {
    const spinner = spin("Authenticating Page ID ...");

    const userId = facebook.userId;
    const userToken = facebook.userToken;

    if (userToken === undefined) {
      throw new CredentialError(
        "User Token is required for Page ID authentication."
      );
    }

    const data: any = await fetch(
      `${userId}/accounts?access_token=${userToken}`
    ).then((r) => r.json());

    if (pageIndex === undefined) {
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
      await inquirer.prompt(questions).then((answers: any) => {
        const { page } = answers;
        pageIndex = page;
      });
    }

    if (pageIndex === undefined) {
      throw new CredentialError("Invalid page index.");
    }

    const appId = facebook.appId;
    const appSecret = facebook.appSecret;

    facebook
      .refreshPageId(appId, appSecret, userToken, pageIndex)
      .verifyPageId();
    spinner.succeed("Page ID Authenticated.");

    return facebook.pageId;
  } else {
    facebook.verifyPageId();
    return pageId;
  }
}
