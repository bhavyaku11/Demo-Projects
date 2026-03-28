import { type FormEvent, useState } from "react";

import { SectionCard } from "@/components/ui/SectionCard";

import { useGame } from "../hooks/useGame";

export function GamePanel() {
  const [guess, setGuess] = useState("");
  const { error, isPending, message, sessionId, state, makeGuess, startNewGame } = useGame();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedGuess = Number(guess);

    if (Number.isNaN(parsedGuess)) {
      return;
    }

    makeGuess(parsedGuess);
    setGuess("");
  };

  return (
    <SectionCard
      title="Guess Engine"
      subtitle="Sample feature module wired to the backend service and isolated game logic."
      action={
        <button type="button" onClick={startNewGame} className="btn btn-primary rounded-full px-4 py-2">
          New Game
        </button>
      }
    >
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="panel-surface space-y-3 p-6">
            <p className="section-label">Session</p>
            <p className="break-all font-mono text-sm leading-7 text-white">{sessionId ?? "No active session"}</p>
          </div>

          <div className="panel-surface space-y-4 p-6">
            <p className="section-label">Make a move</p>
            <form className="flex flex-col gap-4 sm:flex-row" onSubmit={handleSubmit}>
              <input
                type="number"
                min={1}
                max={100}
                value={guess}
                onChange={(event) => setGuess(event.target.value)}
                placeholder="Enter your guess"
                className="input-control flex-1"
              />
              <button
                type="submit"
                disabled={isPending || !sessionId}
                className="btn btn-secondary disabled:opacity-40"
              >
                {isPending ? "Submitting..." : "Send Guess"}
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Stat label="Status" value={state?.status ?? "idle"} />
          <Stat
            label="Range"
            value={state ? `${state.lowerBound} - ${state.upperBound}` : "1 - 100"}
          />
          <Stat label="Attempts" value={String(state?.attemptsRemaining ?? 8)} />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="panel-surface space-y-3 p-6">
            <p className="section-label">Latest update</p>
            <p className="text-sm leading-7 text-brand-text">{error ?? message}</p>
          </div>

          <div className="panel-surface space-y-3 p-6">
            <p className="section-label">Guess history</p>
            <p className="text-sm leading-7 text-brand-muted">
              {state?.guessHistory.length ? state.guessHistory.join(", ") : "No guesses submitted yet."}
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="stat-tile h-full w-full p-6">
      <p className="section-label">{label}</p>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}
