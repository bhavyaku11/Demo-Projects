/**
 * @typedef {{
 *   rewards?: Array<unknown>,
 *   collectedRewards?: number,
 *   status?: "running" | "won" | "lost"
 * }} EnvironmentState
 *
 * @typedef {{
 *   totalScore: number,
 *   breakdown: {
 *     survival: number,
 *     efficiency: number,
 *     completion: number
 *   }
 * }} GradeResult
 */

const SURVIVAL_WEIGHT = 30;
const EFFICIENCY_WEIGHT = 35;
const COMPLETION_WEIGHT = 35;
const SURVIVAL_STEP_TARGET = 40;
const IDEAL_SCORE_PER_STEP = 2.5;

/**
 * Rewards surviving longer, with diminishing returns after a healthy episode length.
 *
 * @param {number} timeSteps
 * @returns {number}
 */
export function evaluateSurvival(timeSteps) {
  const safeSteps = normalizeNonNegativeNumber(timeSteps);
  const ratio = Math.min(safeSteps / SURVIVAL_STEP_TARGET, 1);

  return roundScore(SURVIVAL_WEIGHT * Math.sqrt(ratio));
}

/**
 * Rewards quality of outcome relative to the number of steps consumed.
 * Higher score per step earns more credit, while low or negative scores collapse toward zero.
 *
 * @param {number} score
 * @param {number} steps
 * @returns {number}
 */
export function evaluateEfficiency(score, steps) {
  const safeScore = Number.isFinite(score) ? score : 0;
  const safeSteps = normalizeNonNegativeNumber(steps);

  if (safeSteps === 0 || safeScore <= 0) {
    return 0;
  }

  const scorePerStep = safeScore / safeSteps;
  const ratio = clamp(scorePerStep / IDEAL_SCORE_PER_STEP, 0, 1);

  return roundScore(EFFICIENCY_WEIGHT * ratio);
}

/**
 * Rewards collecting goals, with a premium for fully completing the environment.
 *
 * @param {EnvironmentState} state
 * @returns {number}
 */
export function evaluateGoalCompletion(state) {
  const collectedRewards = normalizeNonNegativeNumber(state?.collectedRewards);
  const remainingRewards = Array.isArray(state?.rewards) ? state.rewards.length : 0;
  const totalRewards = collectedRewards + remainingRewards;
  const completionRatio = totalRewards === 0 ? 0 : collectedRewards / totalRewards;
  const baseScore = COMPLETION_WEIGHT * completionRatio;

  if (state?.status === "won" || remainingRewards === 0) {
    return COMPLETION_WEIGHT;
  }

  if (state?.status === "lost") {
    return roundScore(baseScore * 0.85);
  }

  return roundScore(baseScore);
}

/**
 * Aggregates all environment grading categories into a balanced score out of 100.
 *
 * @param {{
 *   timeSteps: number,
 *   score: number,
 *   steps?: number,
 *   state: EnvironmentState
 * }} input
 * @returns {GradeResult}
 */
export function gradeEnvironment(input) {
  const steps = input?.steps ?? input?.timeSteps;
  const breakdown = {
    survival: evaluateSurvival(input?.timeSteps ?? 0),
    efficiency: evaluateEfficiency(input?.score ?? 0, steps ?? 0),
    completion: evaluateGoalCompletion(input?.state ?? {})
  };

  return {
    totalScore: roundScore(breakdown.survival + breakdown.efficiency + breakdown.completion),
    breakdown
  };
}

/**
 * @param {number} value
 * @returns {number}
 */
function normalizeNonNegativeNumber(value) {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return value;
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * @param {number} value
 * @returns {number}
 */
function roundScore(value) {
  return Math.round(value * 100) / 100;
}
