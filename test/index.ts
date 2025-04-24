import Facebook from "../src";
import type { Authentication } from "../src";

// This file is used to test the general functionality of the library.

const facebook = new Facebook();
const auth: Authentication = {
  profile: "user",
};
await facebook.login(auth).then(({ credentials, scope }) => {
  console.log(credentials);
  console.log(scope);
});

//
// Information
// Retrieve information about the current profile.

// // Page
// const pageID = facebook.info.page.id;
// const pageExpires = facebook.info.page.expires;
// const pageValid = facebook.info.page.valid;
// const pageToken = facebook.access.page.token;
// console.log({ pageID, pageExpires, pageValid, pageToken });

// // User
// const userID = facebook.info.user.id;
// const userExpires = facebook.info.user.expires;
// const userValid = facebook.info.user.valid;
// const userToken = facebook.access.user.token;
// console.log({ userID, userExpires, userValid, userToken });

//
// Publishing
// Publish posts to the current profile.

// // Page history.
// const pagePosts = await facebook.page.posts.read();
// console.log({ pagePosts });

// // User history. Doesn't work for now, because special approval is required.
// const userPosts = await facebook.user.posts.read();
// console.log({ userPosts });

// // Publishing to a page.
// const pagePost = await facebook.page.posts.publish({
//   message: "Hello, world!",
// });
// console.log({ pagePost });

// // Publishing to a user (deprecated).
// const userPost = await facebook.user.posts.publish({
//   message: "Hello, world!",
// });
// console.log({ userPost });

// // Publishing media to a page.
const pagePost = await facebook.page.posts.upload({
  // Change the variable name to pageMedia later
  message: "Hello, world!",
  path: "/Users/anonyo/Downloads/Images/Miscellaneous/fb.png",
});
console.log({ pagePost });

// // Publishing media to a user (deprecated).
// const userMedia = await facebook.user.media.publish({
//   message: "Hello, world!",
//   media: "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png",
// });
// console.log({ userMedia });

// // Editing a page post.
const pagePostEdited = await facebook.page.posts.edit({
  id: pagePost.id,
  message: "Hello, world! edited",
});
console.log({ pagePostEdited });

// // Editing a user post (deprecated).
// const userPost = await facebook.user.posts.edit({
//   id: "1234567890",
//   message: "Hello, world! edited",
// });
// console.log({ userPost });

// // Removing a page post.
const pagePostResult = await facebook.page.posts.remove({
  id: pagePost.id,
});
console.log({ pagePostResult });

// // Removing a user post (deprecated).
// const userPost = await facebook.user.posts.remove({
//   id: "1234567890",
// });
// console.log({ userPost });
