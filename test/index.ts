import Facebook from "../src";

const facebook = new Facebook();

if (facebook.userToken && facebook.userId) {
  facebook.refreshPageId(
    facebook.appId,
    facebook.appSecret,
    facebook.userId,
    facebook.userToken,
    null
  );
}
