<div align="center" style="margin-top: 1em;">
  <a href="https://facebook-js-sdk.vercel.app" target="_blank">
    <picture>
      <img alt="[ the bookface ]" src="https://i.ibb.co/jk6219sS/repo-logo.png" style="max-width: 80%;">
    </picture>
  </a>
</div>

<p align="center" style="margin-top: 1em;">
  <b>Bookface</b> is a modern TypeScript wrapper for <a src="https://developers.facebook.com/docs/">Meta's developer services</a>.
</p>

The Graph API is Meta's platform for building apps and services that interact with their products (i.e. Facebook, Instagram).

Bookface allows you to interact with the Graph API through TypeScript with a more intuitive, organized, and straightforward syntax.

> [!IMPORTANT]  
> This library is in active development.

# Getting Started

To get started with Bookface, you'll first need to install it through your preferred package manager. See the extended [install](#install) section for this.

Once installed, in order to do anything useful, you'll need to create an app with Meta in their [developer portal](https://developers.facebook.com/) and then authenticate said app with Bookface's CLI. This can be complicated, and the process is heavily dependent on what you're trying to do, so it's recommended you go through the in-depth, step-by-step [authentication guide](https://facebook-js-sdk.vercel.app/authentication) provided on the documentation site.

Once you've done all the necessary steps required to interact with Meta's API programmatically, you can finally get started with some actual code. The following is a minimal example for [publishing](https://facebook-js-sdk.vercel.app/posts#creating-posts) and [reading](https://facebook-js-sdk.vercel.app/posts#reading-posts) [page posts](https://facebook-js-sdk.vercel.app/posts#page-posts).

```typescript
import Facebook from "bookface";
import type { Authentication } from "bookface";

// Initialize the client
const facebook = new Facebook();
const auth: Authentication = {};

// Login (unnecessary but good to have)
await facebook.login(auth).then(({ credentials, scope }) => {
  console.log(credentials);
  console.log(scope);
});

// Publish a post to your page
const post = await facebook.page.posts.publish({
  message: "Hello World!",
  media: "./image.png",
});

// Read your page posts
const posts = await facebook.page.posts.read();
```

To do anything else with Bookface, or for a more thorough understanding of the syntax, it's highly recommended that you check out the [documentation site](https://facebook-js-sdk.vercel.app).

# Install

[![JSR](https://jsr.io/badges/@bookface/ts)](https://jsr.io/@bookface/ts)

![NPM Version](https://img.shields.io/npm/v/:@anonyo/bookface)

```sh
bunx jsr add @bookface/ts # Bun

npx jsr add @bookface/ts # npm

deno add jsr:@bookface/ts # Deno

pnpm i jsr:@bookface/ts # pnpm 10.8 or older
pnpm dlx jsr add @bookface/ts # pnpm

yarn add jsr:@bookface/ts # Yarn 4.8 or older
yarn dlx jsr add @bookface/ts # Yarn
```

If you want to install from npm, rather than using jsr, you can use the `@anonyo/bookface` package instead. It should be noted though that this package is not as well maintained as the jsr package.

Once you've installed, you'll likely want to login. You can do this with following command. Replace `npx` with your preferred package manager's package runner (i.e. bunx, dlx).

```sh
npx facebook login
```

# Contributing

This project is looking for contributors — feel free to submit a pull request or open an issue.

If you're looking for something to work on, check out the [roadmap](./ROADMAP.md) for direction.

# License

[MIT](./LICENSE)
