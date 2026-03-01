import { Router } from "express";
import { GeneratedImageWebhook, TrainingWebhook } from "../controllers/modalController";

export const webhookRoute = Router();

webhookRoute.post("/modal/webhook/train", TrainingWebhook);
webhookRoute.post("/modal/webhook/image", GeneratedImageWebhook);
