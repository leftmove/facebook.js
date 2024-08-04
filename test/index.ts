import Facebook from "../src";
import type { Permissions, Config } from "../src";

const facebook = new Facebook();

const config: Config = { path: "./credentials.json", expireTime: 60 };
const scope: Permissions = {
  pages_manage_engagement: true,
  pages_manage_posts: true,
  pages_read_engagement: true,
  pages_read_user_content: true,
  pages_show_list: true,
  read_insights: true,
  business_management: true,
};

// Embed credentials config above into Facebook class
// await facebook
//   .verifyCredentials(config)
//   .refreshCredentials(scope)
//   .fufillCredentials(config);
