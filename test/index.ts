import Facebook from "../src";

const facebook = new Facebook();

facebook
  .login()
  .credentials()
  .catch((error) => console.error(error));

const post = await facebook.posts.upload({
  path: ["/Users/anonyo/Pictures/mark.jpg", "/Users/anonyo/Pictures/fb.png"],
});

console.log(post);
