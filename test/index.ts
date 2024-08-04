import { Facebook } from "../src";

const zuck = new Facebook({
  appId: "494601056372880",
  appSecret: "ed1e95f80b0dc75b109e5fc9b2f45ebf",
});

const token = await zuck.getUserToken();
