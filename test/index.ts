import Facebook from "../src";

const facebook = new Facebook();

facebook
  .login()
  .credentials()
  .then((credentials) => console.log(credentials))
  .catch((error) => console.error(error));

facebook.publish({ message: "Hello, World!" });
