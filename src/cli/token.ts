import open from "open";
import url from "node:url";
import assert from "node:assert";
import http from "http";
import inquirer from "inquirer";

import Facebook from "../index";
import { spin, info } from "./components";
import { UnauthorizedError } from "../index";
import type { Permissions } from "../index";

export async function appCredentials(
  appId: string | undefined,
  appSecret: string | undefined
) {
  if (appId === undefined || appSecret === undefined) {
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

  if (appId === undefined || appSecret === undefined) {
    throw new UnauthorizedError("Invalid app credentials.");
  }

  return { appId, appSecret };
}

export async function appTokenCredential(
  facebook: Facebook,
  appToken: string | undefined
) {
  if (appToken === undefined) {
    const spinner = spin("Authenticating app token ...");

    const appId = facebook.appId;
    const appSecret = facebook.appSecret;

    await facebook.refreshAppToken(appId, appSecret);
    return await facebook.verifyAppToken().then((valid: boolean) => {
      if (valid) {
        spinner.succeed(" App token authenticated.");
        info("success", "App token authenticated.");
        return facebook.appToken;
      } else {
        spinner.fail("App token authentication failed.");
        throw new UnauthorizedError("Invalid app token.");
      }
    });
  } else {
    return await facebook.verifyAppToken(appToken).then((valid: boolean) => {
      if (valid) {
        info("success", "App token authenticated.");
        return facebook.appToken;
      } else {
        throw new UnauthorizedError("Invalid app token.");
      }
    });
  }
}

export async function timeoutCallback(
  timeout: number,
  callback: Function,
  message: string | undefined = undefined,
  rejectCallback: Function | undefined = undefined
) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      rejectCallback
        ? rejectCallback()
        : reject(
            new Error(
              message ? message : `Promise timed out after ${timeout} ms`
            )
          );
    }, timeout);
    callback(
      (value: any) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: any) => (rejectCallback ? rejectCallback(error) : reject(error))
    );
  });
}

export async function userTokenCredential(
  facebook: Facebook,
  scope: Permissions,
  userToken: string | undefined
) {
  if (userToken === undefined) {
    const appId = facebook.appId;
    const appSecret = facebook.appSecret;

    const port = 2279;
    const host = "localhost";
    const path = "/login";
    const redirect = new URL(`http://${host}:${port}${path}`);

    const oauth =
      "https://facebook.com/v20.0/dialog/oauth?" +
      new URLSearchParams({
        client_id: appId,
        response_type: "code",
        auth_type: "rerequest",
        scope: Object.keys(scope).join(","),
        redirect_uri: redirect.href,
      });

    const code: any = await timeoutCallback(
      1000 * 60,
      (resolve: Function) => {
        const spinner = spin(
          "Attempting OAuth for user token in default browser ..."
        );
        const timer = setTimeout(() => {
          spinner.fail("Attempted to open OAuth in default browser.");
          info(
            "auth",
            `If OAuth did not open, you can visit the link manually:\n${oauth}`
          );
        }, 1000 * 5);
        open(oauth);

        const server = http
          .createServer(
            (req: http.IncomingMessage, res: http.ServerResponse) => {
              assert(req.url, "This request doesn't have a URL");
              const { pathname, query } = url.parse(req.url, true);

              switch (pathname) {
                case path:
                  clearTimeout(timer);
                  spinner.succeed(" Opened OAuth in default browser.");
                  resolve(query.code as string);

                  res.writeHead(200);
                  res.end(
                    "Success! Your Facebook instance has been authenticated, you may now close this tab.",
                    () => server.close()
                  );
                  break;
                default:
                  res.writeHead(404);
                  res.end(`Not found, try querying the '${path}' path.`);
              }
            }
          )
          .listen(port, host);
      },
      "OAuth for user token timed out."
    );

    await facebook.refreshUserToken(appId, appSecret, redirect.href, code);
    const spinner = spin("Authenticating user token ...");

    return await facebook.verifyUserCredentials().then((valid: boolean) => {
      if (valid) {
        spinner.succeed(" User token authenticated.");
        info("success", "User token authenticated.");
        return facebook.userToken;
      } else {
        spinner.fail("User token authentication failed.");
        throw new UnauthorizedError("Invalid user token.");
      }
    });
  } else {
    return await facebook
      .verifyUserCredentials(userToken, Infinity)
      .then((valid: boolean) => {
        if (valid) {
          info("success", "User token authenticated.");
          return facebook.userToken;
        } else {
          throw new UnauthorizedError("Invalid user token.");
        }
      });
  }
}

export async function pageTokenCredential(
  facebook: Facebook,
  pageToken: string | undefined
) {
  if (pageToken === undefined) {
    const spinner = spin("Authenticating page token ...");

    const appId = facebook.appId;
    const appSecret = facebook.appSecret;
    const pageId = facebook.pageId;
    const userToken = facebook.userToken;

    if (pageId === undefined) {
      throw new UnauthorizedError(
        "Page ID is required for page token authentication."
      );
    }

    if (userToken === undefined) {
      throw new UnauthorizedError(
        "User token is required for page token authentication."
      );
    }

    await facebook.refreshPageToken(appId, appSecret, pageId, userToken);

    return await facebook.verifyPageCredentials().then((valid: boolean) => {
      if (valid) {
        spinner.succeed(" Page token authenticated.");
        info("success", "Page token authenticated.");
        return facebook.pageToken;
      } else {
        spinner.fail("Page token authentication failed.");
        throw new UnauthorizedError("Invalid page token.");
      }
    });
  } else {
    return await facebook
      .verifyPageCredentials(pageToken)
      .then((valid: boolean) => {
        if (valid) {
          info("success", "Page token authenticated.");
          return facebook.pageToken;
        } else {
          throw new UnauthorizedError("Invalid page token.");
        }
      });
  }
}
