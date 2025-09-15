import Facebook from "../src";
import type { Config } from "../src";
import type { Authentication } from "../src";

// This file is used to test the general functionality of the library.

const config: Config = { pageIndex: 0 };
const facebook = new Facebook(config);
const auth: Authentication = { profile: "page" };
await facebook.login(auth).then(({ credentials, scope }) => {
  console.log(credentials);
  console.log(scope);
});

//
// Information
// Retrieve information about the current profile.

// // App ID
// const appID = facebook.id;
// const appSecret = facebook.secret;
// console.log({ appID, appSecret });

// // App Token
// const appToken = facebook.access.app.token;
// const appTokenExpires = facebook.access.app.expires;
// const appTokenValid = facebook.access.app.valid;
// console.log({ appToken, appTokenExpires, appTokenValid });

// // Page ID
// const pageID = facebook.info.page.id;
// const pageIDExpires = facebook.info.page.expires;
// const pageIDValid = facebook.info.page.valid;
// const pageIndex = facebook.info.index;
// console.log({ pageID, pageIDExpires, pageIDValid, pageIndex });

// // Page Token
// const pageToken = facebook.access.page.token;
// const pageTokenExpires = facebook.access.page.expires;
// const pageTokenValid = facebook.access.page.valid;
// console.log({ pageToken, pageTokenExpires, pageTokenValid });

// // User
// const userID = facebook.info.user.id;
// const userIDExpires = facebook.info.user.expires;
// const userIDValid = facebook.info.user.valid;
// console.log({ userID, userIDExpires, userIDValid });

// // User Token
// const userToken = facebook.access.user.token;
// const userTokenExpires = facebook.access.user.expires;
// const userTokenValid = facebook.access.user.valid;
// console.log({ userToken, userTokenExpires, userTokenValid });

// // Publishing
// // Publish posts to the current profile.

// // Page history.
// const pagePosts = await facebook.page.posts.read();
// console.log({ pagePosts });

// // User history. Doesn't work for now, because special approval is required.
// const userPosts = await facebook.user.posts.read();
// console.log({ userPosts });

// // Get a post.
// // Gets page posts.

// // Get a page post.
// const pagePost = await facebook.page.posts.get({
//   id: "122172394406285076",
// });
// console.log({ pagePost });

// // Get a user post.
// const userPost = await facebook.user.posts.get({
//   id: "1234567890",
// });
// console.log({ userPost });

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

// Publishing media to a page.
// const pagePost = await facebook.page.posts.publish({
//   // Change the variable name to pageMedia later
//   message: "Hello, world!",
//   media: "/Users/anonyo/Downloads/Images/Miscellaneous/fb.png",
// });
// console.log({ pagePost });

// // Publishing media to a user (deprecated).
// const userMedia = await facebook.user.media.publish({
//   message: "Hello, world!",
//   media: "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png",
// });
// console.log({ userMedia });

// // Editing a page post.
// const pagePostEdited = await facebook.page.posts.edit({
//   // id: pagePost.id,
//   id: "122172361214285076",
//   message: "Hello, world! (edited 2)",
// });
// console.log({ pagePostEdited });

// // Editing a user post (deprecated).
// const userPost = await facebook.user.posts.edit({
//   id: "1234567890",
//   message: "Hello, world! (edited)",
// });
// console.log({ userPost });

// // Removing a page post.
// const pagePostResult = await facebook.page.posts.remove({
//   // id: pagePost.id,
//   id: "122172361214285076",
// });
// console.log({ pagePostResult });

// // Removing a user post (deprecated).
// const userPost = await facebook.user.posts.remove({
//   id: "1234567890",
// });
// console.log({ userPost });

// // Publishing a link to a page.
// const pagePost = await facebook.page.posts.publish({
//   message: "Hello, world!",
//   link: "https://www.google.com",
// });
// console.log({ pagePost });

// // Publishing a link to a user (deprecated).
// const userPost = await facebook.user.posts.publish({
//   message: "Hello, world!",
//   link: "https://www.google.com",
// });
// console.log({ userPost });

// // Scheduling a post to a page.
// const later = new Date(Date.now() + 10 * 60 * 1000 + 1000).toISOString();
// const pagePost = await facebook.page.posts.publish({
//   message: "Hello, world!",
//   link: "https://www.google.com",
//   schedule: later,
// });
// console.log({ pagePost });

// // Scheduling a post to a user (deprecated).
// const userPost = await facebook.user.posts.publish({
//   message: "Hello, world!",
//   link: "https://www.google.com",
// });
// console.log({ userPost });

// Comments
// Read comments from a page profile.
// const post = new Post({ id: "122172395366285076" }, facebook);
// const comments = await facebook.page.comments.read(post);
// console.log({ comments });

// // Read comments from a user profile.
// const comments = await facebook.user.posts.comments.read(post);
// console.log({ comments });

// // Get comments.
// // Get a comment from a page post.
// const comment = await facebook.page.comments.get({
//   id: "1446136966366636",
//   post: "122172395366285076",
// });
// console.log({ comment });

// // Get a comment from a user post.
// const userComment = await facebook.user.comments.get({
//   id: "1446136966366636",
//   post: "1234567890",
// });
// console.log({ userComment });

// // Publishing comments.
// // Publish a comment to a page post.
// const pageComment = await facebook.page.comments.publish({
//   post: "122172395366285076",
//   user: "10039207206110825",
//   message: "Hello, world!",
// });
// console.log({ pageComment });

// // Publishing comments to a user post.
// const userComment = await facebook.user.comments.publish({
//   post: "1234567890",
//   user: "10039207206110825",
//   message: "Hello, world!",
// });
// console.log({ userComment });

// Publishing media comments to a page.
// const pageMedia = await facebook.page.comments.publish({
//   post: "122172395366285076",
//   user: "10039207206110825",
//   message: "Hello, world!",
//   media: "/Users/anonyo/Downloads/Images/Miscellaneous/fb.png",
// });
// console.log({ pageMedia });

// // Publishing media comments to a user (deprecated).
// const userMedia = await facebook.user.media.publish({
//   message: "Hello, world!",
//   media: "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png",
// });
// console.log({ userMedia });

// // Publishing replies to a comment on a page post.
// const comment = new Comment(
//   {
//     message: "Hello, world!",
//     id: "724859936642083",
//     post: "122172395366285076",
//   },
//   facebook
// );
// const pageReply = await comment.reply({
//   message: "Hello, world!",
//   id: comment.id,
//   post: "122172395366285076",
// });
// console.log({ pageReply });

// // Publishing replies to a comment on a user post.
// const userReply = await facebook.user.comments.reply({
//   message: "Hello, world!",
//   id: comment.id,
//   post: "122172395366285076",
// });
// console.log({ userReply });
