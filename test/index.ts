import { App, LoginSuccess, spin } from "../src/cli/components";

const app = new App();

const spinner = spin("Authenticating App Token", app);
setTimeout(() => {
  spinner.fail("App Token Authenticated");
}, 1000);
