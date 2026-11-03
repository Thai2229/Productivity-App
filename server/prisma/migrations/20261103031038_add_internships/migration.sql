-- CreateEnum
CREATE TYPE "InternshipStage" AS ENUM ('APPLIED', 'SCREENING', 'EARLY_INTERVIEW', 'FINAL_INTERVIEW', 'OFFER', 'REJECTED');

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "verification" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "internship" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "stage" "InternshipStage" NOT NULL DEFAULT 'APPLIED',
    "location" TEXT,
    "link" TEXT,
    "appliedOn" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "internship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "internship_userId_idx" ON "internship"("userId");

-- AddForeignKey
ALTER TABLE "internship" ADD CONSTRAINT "internship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
