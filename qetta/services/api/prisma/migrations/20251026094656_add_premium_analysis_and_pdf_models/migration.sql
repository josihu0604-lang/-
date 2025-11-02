-- CreateEnum
CREATE TYPE "UserTier" AS ENUM ('FREE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "PDFStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "name" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "tier" "UserTier" NOT NULL DEFAULT 'FREE';

-- CreateTable
CREATE TABLE "PremiumAnalysis" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "phone" TEXT,
    "results" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PremiumAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentOrder" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "planName" TEXT NOT NULL,
    "planDescription" TEXT,
    "paymentMethod" TEXT,
    "tossPaymentKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "failReason" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedPDF" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "analysisId" UUID NOT NULL,
    "planType" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "status" "PDFStatus" NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedPDF_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PremiumAnalysis_userId_idx" ON "PremiumAnalysis"("userId");

-- CreateIndex
CREATE INDEX "PremiumAnalysis_createdAt_idx" ON "PremiumAnalysis"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOrder_orderId_key" ON "PaymentOrder"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOrder_tossPaymentKey_key" ON "PaymentOrder"("tossPaymentKey");

-- CreateIndex
CREATE INDEX "PaymentOrder_userId_idx" ON "PaymentOrder"("userId");

-- CreateIndex
CREATE INDEX "PaymentOrder_orderId_idx" ON "PaymentOrder"("orderId");

-- CreateIndex
CREATE INDEX "PaymentOrder_status_idx" ON "PaymentOrder"("status");

-- CreateIndex
CREATE INDEX "PaymentOrder_createdAt_idx" ON "PaymentOrder"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "GeneratedPDF_userId_idx" ON "GeneratedPDF"("userId");

-- CreateIndex
CREATE INDEX "GeneratedPDF_analysisId_idx" ON "GeneratedPDF"("analysisId");

-- CreateIndex
CREATE INDEX "GeneratedPDF_createdAt_idx" ON "GeneratedPDF"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "PremiumAnalysis" ADD CONSTRAINT "PremiumAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentOrder" ADD CONSTRAINT "PaymentOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedPDF" ADD CONSTRAINT "GeneratedPDF_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedPDF" ADD CONSTRAINT "GeneratedPDF_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "PremiumAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
