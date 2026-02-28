import express from "express";
import { TrainModel, GenerateImage, GenerateImageFromPack } from "common/types";
import { prismaClient, EthnicityEnum } from "db";

import { S3Client } from "bun";
import cors from "cors";
import { authMiddleware, verifyModalWebhook } from "./middleware";
import { ModalModel } from "./models/ModalModel";


const PORT = Number(process.env.PORT ?? 8080);
const modalModel = new ModalModel();

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

app.use(express.json())

app.get("/pre-signed-url", async (req, res) => {

    const key = `models/${Date.now()}_${Math.random()}.zip`;

    const url = S3Client.presign(key, {
        method: "PUT",
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
        endpoint: process.env.ENDPOINT,
        bucket: process.env.BUCKET_NAME,
        expiresIn: 60 * 5,
        type: "application/zip"
    })

    console.log(url)

    res.json({
        url,
        key
    })
})

app.post("/ai/training", authMiddleware, async (req, res) => {
    try {
        const parsedBody = TrainModel.safeParse(req.body);

        if (!parsedBody.success) {
            return res.status(411).json({
                message: "Input incorrect"
            })
        }

        // Create DB record first so we have the modelId to send to Modal
        const data = await prismaClient.model.create({
            data: {
                name: parsedBody.data.name,
                type: parsedBody.data.type,
                age: parsedBody.data.age,
                ethnicity: parsedBody.data.ethnicity as EthnicityEnum,
                eyeColor: parsedBody.data.eyeColor,
                bald: parsedBody.data.bald,
                userId: req.userId!,
                zipUrl: parsedBody.data.zipUrl,
            }
        })

        // Fire training request to Modal with the modelId
        console.log(`Sending training request to Modal for model ${data.id}`);
        console.log(`Modal URL: ${process.env.MODAL_BASE_URL}`);
        (async () => {
            try {
                await modalModel.trainModel(parsedBody.data.zipUrl, parsedBody.data.name, data.id);
                console.log(`Modal training request accepted for model ${data.id}`);
            } catch (err) {
                console.error(`Modal training request failed for model ${data.id}:`, err);
            }
        })();

        res.json({
            modelId: data.id
        })
    } catch (error: any) {
        console.error("Training request failed:", error?.message || error);
        res.status(500).json({
            message: "Training request failed",
            error: error?.message || "Unknown error"
        })
    }
});

app.post("/ai/generate", authMiddleware, async (req, res) => {
    const parsedBody = GenerateImage.safeParse(req.body);

    if (!parsedBody.success) {
        return res.status(411).json({
            message: "Input incorrect"
        })
    }

    const model = await prismaClient.model.findUnique({
        where: {
            id: parsedBody.data.modelId
        }
    })

    if (!model || !model.tensorPath) {
        return res.status(411).json({
            message: "Model not found"
        })
    }

    // Create DB record first so we have the imageId to send to Modal
    const data = await prismaClient.outputImages.create({
        data: {
            prompt: parsedBody.data.prompt,
            userId: req.userId!,
            modelId: parsedBody.data.modelId,
        }
    })

    // Fire generation request to Modal with the imageId
    await modalModel.generateImage(parsedBody.data.prompt, parsedBody.data.modelId, data.id);

    res.json({
        imageId: data.id
    })
});

app.post("/pack/generate", authMiddleware, async (req, res) => {
    const parsedBody = GenerateImageFromPack.safeParse(req.body);

    if (!parsedBody.success) {
        return res.status(411).json({
            message: "Input incorrect"
        })
    }

    const prompts = await prismaClient.packPrompts.findMany({
        where: {
            packId: parsedBody.data.packId
        }
    })

    const model = await prismaClient.model.findFirst({
        where: {
            id: parsedBody.data.modelId
        }
    })

    if (!model) {
        return res.status(411).json({
            message: "model not found"
        })
    }

    // Create all output image records first so we have imageIds
    const images = await prismaClient.outputImages.createManyAndReturn({
        data: prompts.map((prompt: { prompt: string }) => ({
            prompt: prompt.prompt,
            userId: req.userId!,
            modelId: parsedBody.data.modelId,
        }))
    })

    // Fire all generation requests to Modal in parallel
    await Promise.all(
        images.map((image, index) =>
            modalModel.generateImage(prompts[index]!.prompt, parsedBody.data.modelId, image.id)
        )
    );

    res.json({
        images: images.map((image: { id: string }) => image.id)
    })
});

app.get("/pack/bulk", async (req, res) => {
    const packs = await prismaClient.packs.findMany({})

    res.json({
        packs
    })
});

app.get("/image/bulk", authMiddleware, async (req, res) => {
    const ids = req.query.images as string[]
    const limit = req.query.limit as string ?? "10";
    const offset = req.query.offset as string ?? "0";

    const where: any = {
        userId: req.userId!,
        status: {
            not: "Failed"
        }
    };

    if (ids) {
        where.id = { in: ids };
    }

    const imagesData = await prismaClient.outputImages.findMany({
        where,
        orderBy: {
            createdAt: "desc"
        },
        skip: parseInt(offset),
        take: parseInt(limit)
    })

    res.json({
        images: imagesData
    })
});

app.get("/models", authMiddleware, async (req, res) => {
    const models = await prismaClient.model.findMany({
        where: {
            OR: [{ userId: req.userId }, { open: true }]
        }
    })

    res.json({
        models
    })
})

app.post("/modal/webhook/train", async (req, res) => {

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
})

app.post("/modal/webhook/image", async (req, res) => {

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
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on ${PORT}`);
})
