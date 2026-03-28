import type { HealthCheckResponse } from "@scalar/shared";

import { apiClient } from "@/lib/api/client";

export function getHealthStatus() {
  return apiClient<HealthCheckResponse>("/health");
}

