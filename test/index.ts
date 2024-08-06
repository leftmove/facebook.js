import Facebook from "../src";

const facebook = new Facebook();

facebook
  .login()
  .credentials()
  .catch((error) => console.error(error));

facebook.upload({
  url: ["/Users/anonyo/Pictures/mark.jpg", "/Users/anonyo/Pictures/fb.png"],
});

// import axios from "axios";
// import fs from "fs";

// let headersList = {
//   Accept: "*/*",
//   "User-Agent": "Thunder Client (https://www.thunderclient.com)",
// };

// const path = "/Users/anonyo/Pictures/fb.png";
// const formData = new FormData();
// const file = fs.readFileSync(path);

// formData.append(
//   "access_token",
//   "EAARlqVKm8CsBOZBDhd1OQIJThu20Ec4jmjo2SdjQfcq2dWRVQCAOCexJlM3wxSzTzvF4gYGgJVS9ULrVlX8Wtqga5hxAk55oUj0hJ0LIGTiRU3R3vZCTgufj3w5czb9C8bhyIJmNVVCHffSFDuqAyD41bpp3xwAnK2JEEVEQ0yA8tTrlo3EvYnoJWUrX2zLpiYqzEZD"
// );
// formData.append("message", "Hello World!");
// formData.append("published", "false");
// formData.append("temporary", "true");
// formData.append("source", new Blob([file]), "fb.png");

// let bodyContent = formData;

// let reqOptions = {
//   url: "https://graph.facebook.com/v20.0/me/photos",
//   method: "POST",
//   headers: headersList,
//   data: bodyContent,
// };

// let response = await axios
//   .request(reqOptions)
//   .catch((error) => console.error(error.toJSON(), error.response?.data));
// console.log(response?.data);
