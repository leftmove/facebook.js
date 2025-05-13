import app from "./server";
import { serve } from "@hono/node-server";

if (require.main === module) {
  serve(app);
}

const listen = () => serve(app);

export { app, serve, listen };
