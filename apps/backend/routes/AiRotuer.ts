import { Router } from "express";
import { AiGenerate, AiTraining, ImageBulk, ModelsBulk, PackBulk, PackGenerate } from "../controllers/aiController";
import { authMiddleware } from "../middleware";

export const aiRoute = Router();

aiRoute.post("/ai/training", authMiddleware, AiTraining);
aiRoute.post("/ai/generate", authMiddleware, AiGenerate);
aiRoute.post("/pack/generate", authMiddleware, PackGenerate);
aiRoute.get("/pack/bulk", PackBulk);
aiRoute.get("/image/bulk", authMiddleware, ImageBulk);
aiRoute.get("/models", authMiddleware, ModelsBulk);

