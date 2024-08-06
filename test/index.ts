import Facebook from "../src";

const facebook = new Facebook();

facebook
  .login()
  .credentials()
  .catch((error) => console.error(error));

facebook.verifyUserCredentials().then((valid) => console.log(valid));

// console.log(facebook.scope);
// const post = await facebook.posts.publish({ message: "Hello World!" });

// console.log("Deleting in 10 Seconds...");
// setTimeout(() => {
//   post.remove();
// }, 5000);
