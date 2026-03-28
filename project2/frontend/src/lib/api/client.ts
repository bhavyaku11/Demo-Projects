import { env } from "@/lib/env";

export async function apiClient<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`http://localhost:4000${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    credentials: "include",
    ...init
  });

  if (!response.ok) {
    const errorMessage = await extractErrorMessage(response);
    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? "Request failed.";
  } catch {
    return "Request failed.";
  }
}
