import { Facebook } from "../src";

const zuck = new Facebook();

await zuck.refreshAppToken();
