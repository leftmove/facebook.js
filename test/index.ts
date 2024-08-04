import { Facebook } from "../src";

const zuck = new Facebook({ appId: "494601056372880", appSecret: "123" });

const token = await zuck.refreshUserToken();
