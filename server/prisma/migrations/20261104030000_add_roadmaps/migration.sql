-- CreateEnum
CREATE TYPE "SkillStatus" AS ENUM ('LEARNED', 'LEARNING', 'PLANNED');

-- CreateTable
CREATE TABLE "roadmap" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "roadmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "SkillStatus" NOT NULL DEFAULT 'PLANNED',
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "roadmapId" TEXT NOT NULL,

    CONSTRAINT "skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_link" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roadmapId" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,

    CONSTRAINT "skill_link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "roadmap_userId_idx" ON "roadmap"("userId");

-- CreateIndex
CREATE INDEX "skill_roadmapId_idx" ON "skill"("roadmapId");

-- CreateIndex
CREATE INDEX "skill_link_roadmapId_idx" ON "skill_link"("roadmapId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_link_fromId_toId_key" ON "skill_link"("fromId", "toId");

-- AddForeignKey
ALTER TABLE "roadmap" ADD CONSTRAINT "roadmap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill" ADD CONSTRAINT "skill_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "roadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_link" ADD CONSTRAINT "skill_link_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "roadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_link" ADD CONSTRAINT "skill_link_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_link" ADD CONSTRAINT "skill_link_toId_fkey" FOREIGN KEY ("toId") REFERENCES "skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
