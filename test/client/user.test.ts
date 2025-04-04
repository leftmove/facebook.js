import { expect } from "chai";
import { describe, it } from "mocha";

import Facebook from "../../src";
import type { Authentication } from "../../src";

// Initialize the client, and authenticate with credentials.
const facebook = new Facebook();
const auth: Authentication = {
  profile: "user",
};
await facebook
  .login(auth)
  .credentials()

// Example Code

// Publish a text post to the user's profile.
const response = await facebook.user.posts.publish({
  message: "Hello, world!",
});

console.log(response);
console.log("done")

// // Publish a link post to the user's profile.
// facebook.user.posts.publish({
//   link: "https://www.google.com",
// });

// // Publish a video post to the user's profile.
// facebook.user.posts.upload({
//   path: "https://example.com/video.mp4",
// });



