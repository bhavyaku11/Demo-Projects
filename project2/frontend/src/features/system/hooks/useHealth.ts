import { useEffect, useState } from "react";

import type { HealthCheckResponse } from "@scalar/shared";

import { getHealthStatus } from "../api/healthApi";

export function useHealth() {
  const [data, setData] = useState<HealthCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadHealth = async () => {
      try {
        const nextData = await getHealthStatus();

        if (!isMounted) {
          return;
        }

        setData(nextData);
        setError(null);
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        setError(caughtError instanceof Error ? caughtError.message : "Unable to reach the API.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadHealth();

    return () => {
      isMounted = false;
    };
  }, []);

  return { data, error, isLoading };
}

