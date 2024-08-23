import inquirer from "inquirer";

import Facebook, { GraphError } from "../index";
import { Client } from "../index";
import { CredentialError } from "../index";
import { App, spin, info } from "./components";

export async function userIdCredential(
  facebook: Facebook,
  app: App,
  userId: string | undefined
) {
  return facebook.info.user.validate(userId).then((valid: boolean) => {
    if (valid) {
      return facebook.info.user.id;
    } else {
      const spinner = spin("Authenticating User ID", app);
      return facebook.info.user
        .generate(valid, facebook.access.user.token)
        .then(() => {
          spinner.succeed("User ID Authenticated.");
          return facebook.info.user.id;
        })
        .catch((e: GraphError) => {
          spinner.fail("User ID Authentication Failed.");
          throw new CredentialError("Error generating user ID.", e);
        });
    }
  });
}

export async function pageIdCredential(
  facebook: Facebook,
  app: App,
  pageId: string | undefined,
  pageIndex: number | undefined
) {
  return facebook.info.page.validate(pageId).then((valid: boolean) => {
    if (valid) {
      return facebook.info.page.id;
    } else {
      const client = new Client();
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

      return client
        .get(`${facebook.info.user.id}/accounts`, {
          access_token: facebook.access.user.token,
        })
        .then((data: Data) => {
          const spinner = spin("Authenticating Page ID", app);

          if (data.data.length === 0) {
            throw new CredentialError("No pages found.");
          }
          // if (data.data.length === 1) {
          //   pageIndex = 0;
          // }

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

          return new Promise(
            pageIndex === 0 || pageIndex
              ? (resolve, reject) =>
                  facebook.info.page
                    .generate(
                      valid,
                      facebook.info.user.id,
                      facebook.access.user.token,
                      pageIndex
                    )
                    .then(resolve)
                    .catch(reject)
              : (resolve, reject) =>
                  inquirer
                    .prompt(questions)
                    .then((answers: any) => {
                      return facebook.info.page.generate(
                        valid,
                        facebook.info.user.id,
                        facebook.access.user.token,
                        Number(answers.page)
                      );
                    })
                    .then(resolve)
                    .catch(reject)
          )
            .then(() => {
              spinner.succeed("Page ID Authenticated.");
              return facebook.info.page.id;
            })
            .catch((e) => {
              spinner.fail("Page ID Authentication Failed.");
              throw new CredentialError("Error generating page ID.", e);
            });
        });
    }
  });
}
