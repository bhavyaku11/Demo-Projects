import { ArrowRight, BrainCircuit, ShieldAlert } from "lucide-react";
import type { TaskInfo } from "../types";

interface TaskSelectorProps {
  tasks: TaskInfo[];
  selectedTaskId: string;
  onStart: (taskId: string) => void;
  loading: boolean;
}

export function TaskSelector({ tasks, selectedTaskId, onStart, loading }: TaskSelectorProps) {
  return (
    <section>
      <div className="sidebar-section-label">Task Queue</div>
      <div className="task-list">
        {tasks.map((task) => (
          <button
            key={task.task_id}
            type="button"
            className={`task-pill ${selectedTaskId === task.task_id ? "active" : ""}`}
            onClick={() => onStart(task.task_id)}
            disabled={loading}
          >
            <div className={`task-pill-icon ${task.difficulty}`}>
              {task.difficulty === "hard" ? <ShieldAlert size={16} /> : <BrainCircuit size={16} />}
            </div>
            <div className="task-pill-content">
              <div className="task-pill-name">{task.name}</div>
              <div className="task-pill-meta">
                {task.max_steps} steps · {task.difficulty}
              </div>
            </div>
            <ArrowRight size={14} className="text-muted" />
          </button>
        ))}
      </div>
    </section>
  );
}
