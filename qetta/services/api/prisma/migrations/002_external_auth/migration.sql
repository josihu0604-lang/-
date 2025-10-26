-- CreateEnum
CREATE TYPE "ExternalProvider" AS ENUM ('TOSS_CERT', 'KFTC_OPENBANKING');

-- CreateTable
CREATE TABLE "ExternalAuth" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" "ExternalProvider" NOT NULL,
    "providerUserId" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalAuth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExternalAuth_userId_idx" ON "ExternalAuth"("userId");

-- CreateIndex
CREATE INDEX "ExternalAuth_provider_idx" ON "ExternalAuth"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalAuth_userId_provider_key" ON "ExternalAuth"("userId", "provider");

-- AddForeignKey
ALTER TABLE "ExternalAuth" ADD CONSTRAINT "ExternalAuth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
