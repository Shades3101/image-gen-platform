import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware";
import { S3Client } from "bun";

export const uploadRoute = Router();

uploadRoute.get("/pre-signed-url", authMiddleware, async (req: Request, res: Response) => {
    try {
        const key = `models/${Date.now()}_${Math.random()}.zip`;

        const url = S3Client.presign(key, {
            method: "PUT",
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_KEY,
            endpoint: process.env.ENDPOINT,
            bucket: process.env.BUCKET_NAME,
            expiresIn: 60 * 5,
            type: "application/zip"
        });

        res.json({
            url,
            key
        });
    } catch (error) {

        console.error("Pre-sign Failed");

        res.status(500).json({
            error: "Failed to generate pre-signed URL"
        });
    }
});
