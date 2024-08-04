import Facebook from "../src";
import type { Permissions, Authentication } from "../src";

const facebook = new Facebook();

const scope: Permissions = {
  pages_manage_engagement: true,
  pages_manage_posts: true,
  pages_read_engagement: true,
  pages_read_user_content: true,
  pages_show_list: true,
  read_insights: true,
  business_management: true,
};
const config: Authentication = {
  path: "./credentials.json",
  expireTime: 60,
  scope,
};

await facebook.authenticate(config);
