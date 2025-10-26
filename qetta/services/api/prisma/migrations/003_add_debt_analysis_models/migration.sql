-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CHECKING', 'SAVINGS', 'LOAN', 'CREDIT_CARD', 'INSTALLMENT_SAVINGS', 'DEPOSIT');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER', 'LOAN_REPAYMENT', 'LOAN_DISBURSEMENT', 'INTEREST_EARNED', 'INTEREST_PAID', 'FEE', 'OTHER');

-- CreateEnum
CREATE TYPE "DebtAnalysisStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "CreditGrade" AS ENUM ('AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'CC', 'C', 'D');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('SHINBOK_PRE_WORKOUT', 'FRESH_START_FUND', 'INDIVIDUAL_RECOVERY', 'INDIVIDUAL_BANKRUPTCY', 'CREDIT_ADJUSTMENT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ApplicationType" AS ENUM ('SHINBOK_PRE_WORKOUT', 'FRESH_START_FUND', 'INDIVIDUAL_RECOVERY', 'INDIVIDUAL_BANKRUPTCY');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'PENDING_DOCUMENTS', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'COMPLETED');

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" "ExternalProvider" NOT NULL,
    "fintechUseNum" TEXT,
    "bankCode" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "accountName" TEXT,
    "balance" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KRW',
    "interestRate" DECIMAL(5,2),
    "monthlyPayment" DECIMAL(15,2),
    "dueDate" TIMESTAMP(3),
    "maturityDate" TIMESTAMP(3),
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSyncedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "balanceAfter" DECIMAL(15,2) NOT NULL,
    "description" TEXT NOT NULL,
    "category" "TransactionCategory" NOT NULL DEFAULT 'OTHER',
    "merchantName" TEXT,
    "providerTxId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebtAnalysis" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "monthlyIncome" DECIMAL(15,2) NOT NULL,
    "otherDebts" JSONB,
    "totalDebt" DECIMAL(15,2) NOT NULL,
    "totalAssets" DECIMAL(15,2),
    "monthlyPayment" DECIMAL(15,2) NOT NULL,
    "dti" DECIMAL(10,2) NOT NULL,
    "dsr" DECIMAL(10,2),
    "creditScore" INTEGER,
    "creditGrade" "CreditGrade",
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "breakdown" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "eligiblePrograms" TEXT[],
    "status" "DebtAnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "analyzedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DebtAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestructuringPlan" (
    "id" UUID NOT NULL,
    "analysisId" UUID NOT NULL,
    "planType" "PlanType" NOT NULL,
    "planName" TEXT NOT NULL,
    "planDescription" TEXT,
    "adjustedPayment" DECIMAL(15,2) NOT NULL,
    "adjustedInterestRate" DECIMAL(5,2),
    "estimatedPeriod" INTEGER NOT NULL,
    "totalSavings" DECIMAL(15,2),
    "debtReductionRate" DECIMAL(5,2),
    "conditions" JSONB NOT NULL,
    "requirements" JSONB NOT NULL,
    "pros" TEXT[],
    "cons" TEXT[],
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RestructuringPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "analysisId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "applicationType" "ApplicationType" NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "applicationNumber" TEXT,
    "formData" JSONB NOT NULL,
    "pdfPath" TEXT,
    "pdfGeneratedAt" TIMESTAMP(3),
    "submissionRef" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationDocument" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "documentType" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BankAccount_userId_idx" ON "BankAccount"("userId");

-- CreateIndex
CREATE INDEX "BankAccount_provider_idx" ON "BankAccount"("provider");

-- CreateIndex
CREATE INDEX "BankAccount_accountType_idx" ON "BankAccount"("accountType");

-- CreateIndex
CREATE INDEX "BankAccount_lastSyncedAt_idx" ON "BankAccount"("lastSyncedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_accountId_providerTxId_key" ON "Transaction"("accountId", "providerTxId");

-- CreateIndex
CREATE INDEX "Transaction_accountId_transactionDate_idx" ON "Transaction"("accountId", "transactionDate" DESC);

-- CreateIndex
CREATE INDEX "Transaction_transactionDate_idx" ON "Transaction"("transactionDate");

-- CreateIndex
CREATE INDEX "Transaction_category_idx" ON "Transaction"("category");

-- CreateIndex
CREATE INDEX "DebtAnalysis_userId_createdAt_idx" ON "DebtAnalysis"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "DebtAnalysis_status_idx" ON "DebtAnalysis"("status");

-- CreateIndex
CREATE INDEX "RestructuringPlan_analysisId_idx" ON "RestructuringPlan"("analysisId");

-- CreateIndex
CREATE INDEX "RestructuringPlan_planType_idx" ON "RestructuringPlan"("planType");

-- CreateIndex
CREATE INDEX "RestructuringPlan_isRecommended_idx" ON "RestructuringPlan"("isRecommended");

-- CreateIndex
CREATE UNIQUE INDEX "Application_applicationNumber_key" ON "Application"("applicationNumber");

-- CreateIndex
CREATE INDEX "Application_userId_createdAt_idx" ON "Application"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Application_applicationType_idx" ON "Application"("applicationType");

-- CreateIndex
CREATE INDEX "ApplicationDocument_applicationId_idx" ON "ApplicationDocument"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationDocument_documentId_idx" ON "ApplicationDocument"("documentId");

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "BankAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtAnalysis" ADD CONSTRAINT "DebtAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestructuringPlan" ADD CONSTRAINT "RestructuringPlan_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "DebtAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "DebtAnalysis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_planId_fkey" FOREIGN KEY ("planId") REFERENCES "RestructuringPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
