import { Request, Response } from "express";
import { prismaClient } from "db";

export const UserAuth = async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;

        const { username, profilePicture } = req.body;

        const user = await prismaClient.user.upsert({
            where: {
                id: userId,
            },
            update: {
                username,
                profilePicture
            },
            create: {
                id: userId,
                username: username,
                profilePicture: profilePicture || "",
            },
        });

        res.json({
            message: "User synced successfully",
            user
        });

    } catch (error: any) {
        // P2002 = unique constraint violation (e.g. username collision)
        // This is non-fatal — the user is effectively synced already
        
        if (error?.code === "P2002") {
            console.warn("User sync: username collision for userId", req.userId);

            return res.json({ 
                message: "User already synced" 
            });
        } else {
            console.log("Auth Error", error);
        }

        console.error("Error syncing user:", error);

        res.status(500).json({
            message: "User sync failed",
            error: error?.message || "Unknown error"
        });
    }
};
