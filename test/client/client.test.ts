import { expect } from "chai";
import { describe, it } from "mocha";

import Facebook from "../../src";
import type { Authentication } from "../../src";

// Initialize the client, and authenticate with credentials.
const facebook = new Facebook();
const auth: Authentication = {};
await facebook.login(auth).credentials();

describe("Facebook client initialization", () => {
  it("should have correct app credentials", () => {
    expect(facebook.id).to.be.a("string").and.not.empty;
    expect(facebook.secret).to.be.a("string").and.not.empty;
  });

  it("should have correct profile type", () => {
    expect(facebook.profile).to.be.oneOf(["user", "page"]);
  });

  it("should have valid app token", () => {
    expect(facebook.access.app.token).to.be.a("string").and.not.empty;
    expect(facebook.access.app.token).to.include("|"); // App tokens contain a pipe
    expect(facebook.access.app.expires)
      .to.be.a("number")
      .and.be.above(Date.now() / 1000);
  });

  it("should have valid user credentials", () => {
    expect(facebook.access.user.token).to.be.a("string").and.not.empty;
    expect(facebook.access.user.token).to.match(/^EAAR/); // User tokens start with EAAR
    expect(facebook.access.user.expires)
      .to.be.a("number")
      .and.be.above(Date.now() / 1000);
  });

  it("should have valid page credentials", () => {
    expect(facebook.access.page.token).to.be.a("string").and.not.empty;
    expect(facebook.access.page.token).to.match(/^EAAR/); // Page tokens start with EAAR
    expect(facebook.access.page.expires)
      .to.be.a("number")
      .and.be.above(Date.now() / 1000);
  });
});
