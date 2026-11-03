-- CreateTable
CREATE TABLE "stage_change" (
    "id" TEXT NOT NULL,
    "stage" "InternshipStage" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "internshipId" TEXT NOT NULL,

    CONSTRAINT "stage_change_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stage_change_internshipId_idx" ON "stage_change"("internshipId");

-- AddForeignKey
ALTER TABLE "stage_change" ADD CONSTRAINT "stage_change_internshipId_fkey" FOREIGN KEY ("internshipId") REFERENCES "internship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
