import { expect } from "chai";
import { describe, it } from "mocha";
import fs from "fs";

import Facebook from "../../src";
import type { Authentication } from "../../src";

// Initialize the client, and authenticate with credentials.
const facebook = new Facebook();
const auth: Authentication = {
  profile: "page",
};
await facebook.login(auth).credentials();

describe("Page information", () => {
  it("should have an ID", () => {
    expect(facebook.info.page.id).to.be.a("string").and.not.empty;
  });
  it("should have an expiration date", () => {
    expect(facebook.info.page.expires).to.be.a("number").and.not.empty;
  });
  it("should be valid", () => {
    expect(facebook.info.page.valid).to.be.true;
  });
});

describe("Page posts", () => {
  it("should have posts", async () => {
    const posts = await facebook.page.posts.read();
    expect(posts).to.be.an("array").and.not.empty;
  });
  it("should have a post", async () => {
    const posts = await facebook.page.posts.read();
    const post = posts.at(0);
    expect(post).to.exist;
    expect(post).to.be.instanceOf(Object);
    expect(Object.keys(post!)).to.not.be.empty;
  });
});

describe("Page publishing", () => {
  let post: any;
  it("should be able to publish", async () => {
    post = await facebook.page.posts.publish({
      message: "Hello, world!",
    });
    expect(post).to.exist;
    expect(post).to.be.instanceOf(Object);
    expect(Object.keys(post!)).to.not.be.empty;
  });
  it("should be able to edit", async () => {
    const edited = await facebook.page.posts.edit({
      id: post.id,
      message: "Hello, world! (edited)",
    });
    expect(edited).to.exist;
    expect(Object.keys(edited!)).to.not.be.empty;
    expect(edited.success).to.be.true;
  });
  it("should be able to delete", async () => {
    const deleted = await facebook.page.posts.remove(post);
    expect(deleted).to.exist;
    expect(Object.keys(deleted!)).to.not.be.empty;
    expect(deleted.success).to.be.true;
  });
  it("should be able to upload", async () => {
    const tempFile = "test/temp.txt";
    fs.writeFileSync(tempFile, "Test content");
    const path = tempFile;
    const uploaded = await facebook.page.posts.upload({
      message: "Hello, world! (uploaded)",
      path,
    });
    expect(uploaded).to.exist;
    expect(Object.keys(uploaded!)).to.not.be.empty;
    fs.unlinkSync(tempFile);
  });
});
