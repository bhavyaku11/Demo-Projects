export type ViolationType =
  | "spam"
  | "hate_speech"
  | "misinformation"
  | "harassment"
  | "none";

export type ModAction = "remove" | "warn" | "allow" | "escalate";

export interface Observation {
  post_id: string;
  content: string;
  author_id: string;
  author_history: Record<string, unknown>;
  context: Record<string, unknown>;
  metadata: Record<string, unknown>;
  task_id: string;
  step_number: number;
  max_steps: number;
}

export interface Action {
  post_id: string;
  decision: ModAction;
  violation_type: ViolationType;
  confidence: number;
  reasoning?: string | null;
}

export interface Reward {
  value: number;
  breakdown: Record<string, number>;
  feedback: string;
}

export interface EnvironmentState {
  task_id: string;
  step: number;
  max_steps: number;
  posts_reviewed: number;
  correct_decisions: number;
  false_positives: number;
  false_negatives: number;
  cumulative_reward: number;
  done: boolean;
  episode_score: number;
}

export interface StepResult {
  observation: Observation | null;
  reward: Reward;
  done: boolean;
  info: Record<string, unknown>;
}

export interface TaskInfo {
  task_id: string;
  name: string;
  description: string;
  difficulty: string;
  action_schema: Record<string, unknown>;
  max_steps: number;
}

export interface GraderResponse {
  task_id?: string;
  final_score: number;
  state: Record<string, unknown>;
}

export interface BaselineScores {
  spam_detection: number;
  hate_speech: number;
  nuanced_moderation: number;
}

export interface BaselineResponse {
  status: string;
  scores: BaselineScores;
}
