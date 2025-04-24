import { expect } from "chai";
import { describe, it } from "mocha";

import Facebook from "../../src";
import type { Authentication } from "../../src";

// Initialize the client
const facebook = new Facebook();
const auth: Authentication = {
  profile: "user",
};

describe("User information", () => {
  console.log("hello world");
  // it("should have an ID", () => {
  //   expect(facebook.info.user.id).to.be.a("string").and.not.empty;
  // });
  // it("should have an expiration date", () => {
  //   expect(facebook.info.user.expires).to.be.a("number").and.not.empty;
  // });
  // it("should be valid", () => {
  //   expect(facebook.info.user.valid).to.be.true;
  // });
});
