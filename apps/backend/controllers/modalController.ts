import { prismaClient } from "db";
import { Request, Response } from "express";
import { verifyModalWebhook } from "../middleware";

export const TrainingWebhook = async (req: Request, res: Response) => {
    
        if (!verifyModalWebhook(req)) {
            return res.status(401).json({
                message: "Invalid Signature "
            });
        }
    
        const { modelId, status, tensorPath, thumbnailUrl, error } = req.body;
    
        if (status === "Failed") {
            console.error(`Training Failed For Model ${modelId}: ${error}`);
    
            await prismaClient.model.update({
                where: {
                    id: modelId
                },
                data: {
                    trainingStatus: "Failed"
                }
            })
    
            return res.json({
                message: "Failure Recorded"
            });
        }
    
        // Thumbnail was generated and uploaded on the Modal side during training
        await prismaClient.model.update({
            where: {
                id: modelId
            },
            data: {
                trainingStatus: "Generated",
                tensorPath,
                thumbnail: thumbnailUrl,
            }
        })
    
        res.json({
            message: "Webhook received"
        });
}

export const GeneratedImageWebhook = async (req: Request, res: Response) => {
    
        if (!verifyModalWebhook(req)) {
    
            return res.status(401).json({
                message: "Invalid signature"
            });
        }
    
        const { imageId, status, imageUrl, error } = req.body;
    
        if (status === "Failed") {
            console.error(`Image generation failed for ${imageId}: ${error}`);
    
            await prismaClient.outputImages.update({
                where: {
                    id: imageId
                },
                data: {
                    status: "Failed"
                },
            });
    
            return res.json({
                message: "Failure recorded"
            });
        }
    
        await prismaClient.outputImages.update({
            where: {
                id: imageId
            },
            data: {
                status: "Generated",
                imageUrl,
            },
        });
    
        res.json({
            message: "Webhook received"
        });
}