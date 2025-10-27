<div style="display: flex; flex-direction: column; align-items: center; padding: 5% 10%;">
  <img src="https://i.ibb.co/jk6219sS/repo-logo.png" alt="[ the bookface ]" />
  <span style="margin-top: 2em;"><b>Bookface</b> is a modern TypeScript wrapper for <a src="https://developers.facebook.com/docs/">Meta's developer services</a>.</span>
  <br />
  <span>
  The Graph API is Meta's platform for building apps and services that interact with their products (i.e. Facebook, Instagram).
  </span>
  <br />
  <span>
  Bookface allows you to interact with the Graph API through TypeScript, with a more intuitive, organized, and straightforward syntax.
  </span>
</div>

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

### Bun

```sh
bunx jsr add @bookface/ts
```

### npm

```sh
npx jsr add @bookface/ts
```

### Deno

```sh
deno add jsr:@bookface/ts
```

### pnpm

```sh
pnpm i jsr:@bookface/ts # using pnpm 10.8 or older
pnpm dlx jsr add @bookface/ts
```

### Yarn

```sh
yarn add jsr:@bookface/ts # using Yarn 4.8 or older)
yarn dlx jsr add @bookface/ts
```

_(Although the jsr package is better maintained, npm is supported with `@anonyo/bookface`.)_

Once you've installed, you'll likely want to login. You can do this with following command. Replace `npx` with your preferred package manager's package runner (i.e. bunx, dlx).

```sh
npx facebook login
```
