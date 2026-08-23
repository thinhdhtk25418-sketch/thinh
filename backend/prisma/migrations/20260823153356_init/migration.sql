-- CreateTable
CREATE TABLE "Prompt" (
    "id" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sample" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Essay" (
    "id" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "submittedAt" TIMESTAMP(3),
    "gradedAt" TIMESTAMP(3),
    "timerEndsAt" TIMESTAMP(3),
    "timerExpiredAt" TIMESTAMP(3),
    "ta" DOUBLE PRECISION,
    "cc" DOUBLE PRECISION,
    "lr" DOUBLE PRECISION,
    "gra" DOUBLE PRECISION,
    "overall" DOUBLE PRECISION,
    "feedback" TEXT,
    "annotations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Essay_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Essay" ADD CONSTRAINT "Essay_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
