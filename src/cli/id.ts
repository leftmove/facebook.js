import inquirer from "inquirer";

import Facebook from "../index";
import { FACEBOOK_GRAPH_API } from "../index";
import { CredentialError } from "../index";
import { spin } from "./components";

export async function userIdCredential(
  facebook: Facebook,
  userId: string | undefined
) {
  if (userId === undefined) {
    const spinner = spin("Authenticating user ID ...");

    const appId = facebook.appId;
    const appSecret = facebook.appSecret;
    const userToken = facebook.userToken;

    if (userToken === undefined) {
      throw new CredentialError(
        "User token is required for user ID authentication."
      );
    }

    await facebook.refreshUserId(appId, appSecret, userToken);
    return await facebook.verifyUserId().then((valid: boolean) => {
      if (valid) {
        spinner.succeed("User ID authenticated.");
        return facebook.userId;
      } else {
        spinner.fail("User ID authentication failed.");
        throw new CredentialError("Invalid user ID.");
      }
    });
  } else {
    return await facebook.verifyUserId(userId).then((valid: boolean) => {
      if (valid) {
        return userId;
      } else {
        throw new CredentialError("Invalid user ID.");
      }
    });
  }
}

export async function pageIdCredential(
  facebook: Facebook,
  pageId: string | undefined,
  pageIndex: number | undefined
) {
  if (pageId === undefined) {
    const spinner = spin("Authenticating page ID ...");

    const userId = facebook.userId;
    const userToken = facebook.userToken;

    if (userToken === undefined) {
      throw new CredentialError(
        "User token is required for page ID authentication."
      );
    }

    if (userId === undefined) {
      throw new CredentialError(
        "User ID is required for page ID authentication."
      );
    }

    interface Data {
      data: {
        access_token: string;
        category: string;
        category_list: {
          id: string;
          name: string;
        }[];
        name: string;
        id: string;
        tasks: string[];
      }[];
      paging: {
        cursors: {
          before: string;
          after: string;
        };
      };
    }

    spinner.stop();
    const data: Data = await fetch(
      `${FACEBOOK_GRAPH_API}/${userId}/accounts?access_token=${userToken}`
    ).then((r) => r.json());

    if (pageIndex === undefined) {
      const questions: any = [
        {
          type: "list",
          name: "page",
          message: "Select a Page:",
          choices: data.data.map((d, i) => {
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
        pageIndex = Number(page);
      });
    }

    spinner.start();
    if (pageIndex === undefined) {
      throw new CredentialError("Invalid page index.");
    }

    const appId = facebook.appId;
    const appSecret = facebook.appSecret;

    await facebook.refreshPageId(
      appId,
      appSecret,
      userId,
      userToken,
      pageIndex
    );
    return await facebook.verifyPageId().then((valid: boolean) => {
      if (valid) {
        spinner.succeed("Page ID authenticated.");
        return facebook.pageId;
      } else {
        spinner.fail("Page ID authentication failed.");
        throw new CredentialError("Invalid page ID.");
      }
    });
  } else {
    console.log("not undefined");
    return await facebook.verifyPageId(pageId).then((valid: boolean) => {
      if (valid) {
        return facebook.pageId;
      } else {
        throw new CredentialError("Invalid page ID.");
      }
    });
  }
}
