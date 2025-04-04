import { expect } from "chai";
import { describe, it } from "mocha";

import { REQUIRED_CREDENTIALS } from "./client.test";
import Facebook from "../../src";

if (!REQUIRED_CREDENTIALS.every((cred) => process.env[cred])) {
  throw new Error(
    "Facebook credentials not found in environment variables. " +
    `Please set ${REQUIRED_CREDENTIALS.join(", ")} before running tests.`
  );
}

// Example Code

const facebook = new Facebook();

facebook.user.posts.publish({
  message: "Hello, world!",
});

