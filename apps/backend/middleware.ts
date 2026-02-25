import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Extend Express Request interface to include userId
declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "No token provided"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.AUTH_JWT_KEY!, {
            algorithms: ['RS256']
        });

        if (typeof decoded === 'object' && decoded.sub) {
            req.userId = decoded.sub;
            return next();
        }

        return res.status(403).json({
            message: "Invalid token payload"
        });

    } catch (error) {
        res.status(403).json({
            message: "Error While decoding"
        })
    }
}

export function verifyModalWebhook(req: Request): boolean {
    const signature = req.headers["x-modal-signature"] as string;
    
    if(!signature) {
        return false;
    }

    const expected = crypto.createHmac("sha256", process.env.MODAL_WEBHOOK_SECRET!).update(JSON.stringify(req.body)).digest("hex");

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected)
    );
}