# facebook.js

A modern Facebook Graph API client and CLI.

## Install

```bash
bun add @anonyo/facebook.js
```

## Authenticate (CLI)

Most API calls require credentials. Use the built‑in CLI to create a local `credentials.json`.

```bash
bunx facebook login
```

Optionally store credentials globally for other directories:

```bash
bunx facebook credentials store
```

## Minimal usage

Publish a page post (requires credentials from the step above):

```ts
import Facebook from "@anonyo/facebook.js";

const facebook = new Facebook();
const post = await facebook.page.posts.publish({
  message: "Hello from the API",
});
console.log(post.id);
```

Read recent page posts:

```ts
import Facebook from "@anonyo/facebook.js";

const facebook = new Facebook();
const posts = await facebook.page.posts.read();
console.log(posts.map((p) => p.id));
```

## License

MIT
