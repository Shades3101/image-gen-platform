/*
  Warnings:

  - You are about to drop the column `falAiRequest` on the `Model` table. All the data in the column will be lost.
  - You are about to drop the column `falAiRequest` on the `OutputImages` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Model_falAiRequest_idx";

-- DropIndex
DROP INDEX "Model_falAiRequest_key";

-- DropIndex
DROP INDEX "OutputImages_falAiRequest_idx";

-- DropIndex
DROP INDEX "OutputImages_falAiRequest_key";

-- AlterTable
ALTER TABLE "Model" DROP COLUMN "falAiRequest";

-- AlterTable
ALTER TABLE "OutputImages" DROP COLUMN "falAiRequest";
