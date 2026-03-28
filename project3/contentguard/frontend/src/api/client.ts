import axios from "axios";
import type {
  Action,
  BaselineResponse,
  EnvironmentState,
  GraderResponse,
  Observation,
  StepResult,
  TaskInfo,
} from "../types";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const client = axios.create({
  baseURL,
  timeout: 300000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const api = {
  async health(): Promise<{ status: string; env: string; version: string }> {
    const response = await client.get("/health");
    return response.data;
  },
  async reset(taskId: string): Promise<Observation> {
    const response = await client.post("/reset", null, {
      params: { task_id: taskId },
    });
    return response.data;
  },
  async step(action: Action): Promise<StepResult> {
    const response = await client.post("/step", action);
    return response.data;
  },
  async getState(): Promise<EnvironmentState | Record<string, unknown>> {
    const response = await client.get("/state");
    return response.data;
  },
  async getTasks(): Promise<TaskInfo[]> {
    const response = await client.get("/tasks");
    return response.data;
  },
  async getGrader(): Promise<GraderResponse> {
    const response = await client.get("/grader");
    return response.data;
  },
  async runBaseline(): Promise<BaselineResponse> {
    const response = await client.post("/baseline");
    return response.data;
  },
};
