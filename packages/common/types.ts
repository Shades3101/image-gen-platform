import { z } from "zod";

export const TrainModel = z.object({
    name: z.string(),
    type: z.enum(["Man", "Woman", "Others"]),
    age: z.number(),
    ethnicity: z.enum(["White", "Black", "AsianAmerican", "EastAsian", "SouthEastAsian", "SouthAsian", "MiddleEastern", "Pacific", "Hispanic"]),
    eyeColor: z.enum(["Brown", "Blue", "Hazel", "Gray"]),
    bald: z.boolean(),
    zipUrl: z.string()
})

export const GenerateImage = z.object({
    prompt: z.string(),
    modelId: z.string(),
    num: z.number()
})

export const GenerateImageFromPack = z.object({
    modelId: z.string(),
    packId: z.string()
})