import Facebook from "../src";
import type { Authentication } from "../src";

const facebook = new Facebook();
const auth: Authentication = {
  profile: "user",
};

facebook
  .login(auth)
  .credentials()
  // .then((credentials) => console.log(credentials))
  .catch((e) => console.error(e));

const post = await facebook.user.posts.publish({ message: "Hello, World!" });
const id = post.id;

const newPost = await facebook.posts.get({ id });
const newId = newPost.id;
await facebook.posts.edit({ id: newId, message: "Hello, World! 2" });
setTimeout(async () => {
  await facebook.posts.remove({ id: newId });
}, 1000 * 5);

// Things to test

// - posts
//   - publish
//   - get
//   - edit
//   - remove
// - comments
//   - publish
//   - get
//   - edit
//   - remove
