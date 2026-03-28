import { useGame } from "./useGame";

export function useSimulation() {
  const game = useGame();

  return {
    error: game.error,
    evaluation: game.evaluation,
    gridSize: game.gridSize,
    isBootstrapping: game.isBootstrapping,
    isStarting: game.isStarting,
    isStepping: game.isMoving,
    message: game.message,
    resetSimulation: game.resetGame,
    rewardsCollected: game.rewardsCollected,
    setGridSize: game.setGridSize,
    simulation: game.simulation,
    startSimulation: game.startGame,
    stepSimulation: game.moveAgent
  };
}
