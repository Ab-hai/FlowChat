-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "clarityScore" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "overusedWords" JSONB NOT NULL,
    "betterPhrasings" JSONB NOT NULL,
    "focusArea" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_conversationId_key" ON "Feedback"("conversationId");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
