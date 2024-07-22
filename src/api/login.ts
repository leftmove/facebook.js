import http from "http";
import assert from "node:assert";
import url from "node:url";

import open from "open";
import chalk from "chalk";
import ora from "ora";

import Client from "./client";
import { writeToJSONCredentials } from "../credentials";
import { CredentialError } from "../errors";
import type { writeCredentials } from "../credentials";

const client = new Client();

export interface Permissions {
  commerce_account_manage_orders?: boolean;
  commerce_account_read_orders?: boolean;
  commerce_account_read_reports?: boolean;
  commerce_account_read_settings?: boolean;
  instagram_shopping_tag_products?: boolean;
  email?: boolean;
  ads_management?: boolean;
  ads_read?: boolean;
  business_management?: boolean;
  instagram_manage_events?: boolean;
  page_events?: boolean;
  pages_manage_ads?: boolean;
  pages_manage_cta?: boolean;
  pages_manage_engagement?: boolean;
  pages_manage_instant_articles?: boolean;
  pages_manage_metadata?: boolean;
  pages_manage_posts?: boolean;
  pages_messaging?: boolean;
  pages_messaging_subscriptions?: boolean;
  pages_read_engagement?: boolean;
  pages_read_user_content?: boolean;
  pages_show_list?: boolean;
  read_page_mailboxes?: boolean;
  catalog_management?: boolean;
  instagram_basic?: boolean;
  instagram_branded_content_ads_brand?: boolean;
  instagram_branded_content_brand?: boolean;
  instagram_branded_content_creator?: boolean;
  instagram_content_publish?: boolean;
  instagram_manage_comments?: boolean;
  instagram_manage_insights?: boolean;
  instagram_manage_messages?: boolean;
  leads_retrieval?: boolean;
  manage_fundraisers?: boolean;
  publish_video?: boolean;
  read_insights?: boolean;
  whatsapp_business_management?: boolean;
  whatsapp_business_messaging?: boolean;
}
const DEFAULT_SCOPE: Permissions = {
  pages_manage_engagement: true,
  pages_manage_posts: true,
  pages_read_engagement: true,
  pages_read_user_content: true,
  pages_show_list: true,
  read_insights: true,
  business_management: true,
};

export async function loginUser(
  appId: string,
  appSecret: string,
  scope: Permissions = DEFAULT_SCOPE,
  writeCredentials: writeCredentials = writeToJSONCredentials
) {
  if (appId === "" || appSecret === "") {
    throw new CredentialError(
      "App ID and App Secret are required to generate user tokens."
    );
  }

  const port = 2279;
  const host = "localhost";
  const redirect = new URL(`http://${host}:${port}/login`);

  const server = http.createServer(
    async (req: http.IncomingMessage, res: http.ServerResponse) => {
      assert(req.url, "This request doesn't have a URL");
      const { pathname, query } = url.parse(req.url, true);

      switch (pathname) {
        case "/login":
          const code = query.code;
          const data = await client
            .get("oauth/access_token", {
              code,
              client_id: appId,
              client_secret: appSecret,
              redirect_uri: redirect.href,
            })
            .catch((e: any) => {
              const error = new CredentialError("Error getting user token.", e);
              throw error;
            });

          console.log(chalk.green("✓"), "Successfully authenticated!");

          const userToken = data.access_token;
          const userTokenExpires = data.expires_in;
          writeCredentials({ userToken, userTokenExpires });

          res.writeHead(200);
          res.end(
            "Success! Your Facebook instance has been authenticated, you may now close this tab.",
            () => server.close()
          );

          break;
        default:
          res.writeHead(404);
          res.end("not found");
      }
    }
  );

  const oauth =
    "https://facebook.com/v20.0/dialog/oauth?" +
    new URLSearchParams({
      client_id: appId,
      response_type: "code",
      auth_type: "rerequest",
      scope: Object.keys(scope).join(","),
      redirect_uri: redirect.href,
    });
  server.listen(port, host);

  const spinner = ora({
    text: "Attempting OAuth in default browser",
    spinner: "dots",
    color: "white",
  }).start();
  await open(oauth);
  setTimeout(() => {
    spinner.stop();
    console.log(
      chalk.yellow("!"),
      "If OAuth did not open, visit the link manually:",
      chalk.blue(oauth)
    );
  }, 1000);
}
