-- CreateTable
CREATE TABLE "SharedLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "roomName" TEXT,
    "style" TEXT,
    "perspective" TEXT,
    "description" TEXT,
    "expiresAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareComment" (
    "id" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "reaction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SharedLink_userId_idx" ON "SharedLink"("userId");

-- CreateIndex
CREATE INDEX "ShareComment_shareId_idx" ON "ShareComment"("shareId");

-- AddForeignKey
ALTER TABLE "SharedLink" ADD CONSTRAINT "SharedLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareComment" ADD CONSTRAINT "ShareComment_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "SharedLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
