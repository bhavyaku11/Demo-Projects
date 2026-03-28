import { Router } from "express";

import {
  environmentScoreController,
  environmentStateController,
  moveEnvironmentController,
  startEnvironmentController,
  stepEnvironmentController
} from "../controllers/environment.controller.js";
import { guessController, startGuessGameController } from "../controllers/guess.controller.js";

export const gameRouter = Router();

gameRouter.post("/start", startEnvironmentController);
gameRouter.post("/move", moveEnvironmentController);
gameRouter.post("/step", stepEnvironmentController);
gameRouter.get("/state", environmentStateController);
gameRouter.get("/score", environmentScoreController);

gameRouter.post("/guess/start", startGuessGameController);
gameRouter.post("/guess/:sessionId/guess", guessController);
