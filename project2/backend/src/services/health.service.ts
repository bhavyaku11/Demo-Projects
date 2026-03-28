import { APP_NAME, type HealthCheckResponse } from "@scalar/shared";

import { env } from "../config/env.js";

export function getHealthStatus(): HealthCheckResponse {
  return {
    status: "ok",
    service: APP_NAME,
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime())
  };
}
