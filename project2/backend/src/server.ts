import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`[server] listening on http://localhost:${env.PORT}`);
});

process.on("unhandledRejection", (reason) => {
  console.error("[server] unhandled rejection", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[server] uncaught exception", error);
  shutdown(1);
});

process.on("SIGTERM", () => {
  console.info("[server] received SIGTERM");
  shutdown(0);
});

process.on("SIGINT", () => {
  console.info("[server] received SIGINT");
  shutdown(0);
});

function shutdown(exitCode: number) {
  server.close((error) => {
    if (error) {
      console.error("[server] shutdown error", error);
      process.exit(1);
      return;
    }

    console.info("[server] shutdown complete");
    process.exit(exitCode);
  });
}
