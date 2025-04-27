import open from "open";
import url from "node:url";
import assert from "node:assert";
import http from "http";
import inquirer from "inquirer";

import Facebook, { CredentialError } from "../index";
import { App, spin, info } from "./components";
import { UnauthorizedError, GraphError } from "../index";
import type { Permissions } from "../index";

import successHTML from "./success.html" with { type: "text" };

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
  app: App,
  appToken: string | undefined
) {
  return facebook.access.app.validate(appToken).then((valid) => {
    if (valid) {
      return facebook.access.app.token;
    } else {
      const spinner = spin("Authenticating App Token", app);
      return facebook.access.app
        .generate()
        .then(() => {
          spinner.succeed("App Token Authenticated");
          return facebook.access.app.token;
        })
        .catch((e: GraphError) => {
          spinner.fail("App Token Authentication Failed");
          throw new UnauthorizedError("Error generating app token.", e);
        });
    }
  });
}

export async function timeoutCallback(
  timeout: number,
  callback: Function,
  message: string | undefined = undefined,
  rejectCallback: Function | undefined = undefined
): Promise<any> {
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

// const successHTML = `
// <html lang="en">
//   <head>
//     <meta charset="utf-8">
//     <title>Facebook Authentication</title>
//   </head>
//   <body>
//     <h1 style="text-align: center;">Success!</h1>
//     <hr>
//     <div style="text-align: center;">
//       <p>Facebook was successfully authenticated.</p>
//       <p>You may now close this tab and return to the terminal.</p>
//     </div>
//   </body>
// </html>
// `;

export async function userTokenCredential(
  facebook: Facebook,
  app: App,
  scope: Permissions,
  userToken: string | undefined
) {
  return facebook.access.user
    .validate(userToken)
    .catch(() => false)
    .then((valid: boolean) => {
      if (valid) {
        return facebook.access.user.token;
      } else {
        const appId = facebook.id;

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

        return timeoutCallback(
          1000 * 60,
          (resolve: Function) => {
            const spinner = spin(
              "Attempting OAuth for User Token in Default Browser",
              app
            );
            const timer = setTimeout(() => {
              spinner.fail("Attempted to Open OAuth in Default Browser.");
              info(
                `If OAuth did not open, you can visit the link manually:`,
                app
              );
              info(oauth, app, "blueBright");
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
                      res.end(successHTML, () => server.close());
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
        ).then((code: string) => {
          const spinner = spin("Authenticating User Token", app);
          return facebook.access.user
            .fulfill(code, redirect.href, facebook.id, facebook.secret)
            .then(() => {
              spinner.succeed(" User Token Authenticated.");
              return facebook.access.user.token;
            })
            .catch((e: GraphError) => {
              spinner.fail("User Token Authentication Failed.");
              throw new CredentialError("Error generating user token.", e);
            });
        });
      }
    });
}

export async function pageTokenCredential(
  facebook: Facebook,
  app: App,
  pageToken: string | undefined
) {
  return facebook.access.page.validate(pageToken).then((valid: boolean) => {
    if (valid) {
      return facebook.access.page.token;
    } else {
      const spinner = spin("Authenticating Page Token", app);
      return facebook.access.page
        .generate()
        .then(() => {
          spinner.succeed("Page Token Authenticated.");
          return facebook.access.page.token;
        })
        .catch((e: GraphError) => {
          spinner.fail("Page Token Authentication Failed.");
          throw new CredentialError("Error generating page token.", e);
        });
    }
  });
}
