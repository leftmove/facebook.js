import express from "express";

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  app.emit("request", req, res);
  next();
});

export function serve(port: number = 3000, callback?: () => void) {
  return app.listen(port, callback);
}

export { app };
