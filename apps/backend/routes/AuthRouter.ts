import { Router } from "express";
import { UserAuth } from "../controllers/authController";
import { authMiddleware } from "../middleware";

export const authRoute = Router();

authRoute.post("/user-auth", authMiddleware, UserAuth);