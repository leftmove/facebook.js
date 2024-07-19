import { Facebook } from "../../src";

import { expect } from "chai";

describe("Facebook", () => {
  it("should be defined", () => {
    const facebook = new Facebook({ appId: "123", appSecret: "123" });
    expect(facebook).to.exist;
  });
});
