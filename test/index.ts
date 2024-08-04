import Facebook from "../src";

const facebook = new Facebook();

facebook
  .login()
  .credentials()
  .catch((error) => console.error(error));

facebook.upload({
  message: "Hello, world!",
  url: [
    "/Users/anonyo/Pictures/profoto-albert-watson-steve-jobs-pinned-image-3840x2160px-2.jpeg",
    "/Users/anonyo/Pictures/Stuff/GT70z5PXMAAB7Ur.jpeg",
  ],
});
