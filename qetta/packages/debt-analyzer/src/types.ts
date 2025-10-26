/**
 * Debt Analyzer Type Definitions
 * 
 * All interfaces for debt analysis, credit grades, and restructuring plans
 */

// ===== ENUMS =====

export enum CreditGrade {
  AAA = 'AAA',
  AA = 'AA',
  A = 'A',
  BBB = 'BBB',
  BB = 'BB',
  B = 'B',
  CCC = 'CCC',
  CC = 'CC',
  C = 'C',
  D = 'D'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum PlanType {
  SHINBOK_PRE_WORKOUT = 'SHINBOK_PRE_WORKOUT',      // 신복위 프리워크아웃
  FRESH_START_FUND = 'FRESH_START_FUND',            // 새출발기금
  INDIVIDUAL_RECOVERY = 'INDIVIDUAL_RECOVERY',      // 개인회생
  INDIVIDUAL_BANKRUPTCY = 'INDIVIDUAL_BANKRUPTCY',  // 개인파산
  CREDIT_ADJUSTMENT = 'CREDIT_ADJUSTMENT',          // 신용회복
  CUSTOM = 'CUSTOM'                                 // 커스텀 플랜
}

// ===== INTERFACES =====

/**
 * Bank account information from OAuth providers
 */
export interface BankAccountInfo {
  id: string;
  bankName: string;
  accountNumber: string; // Masked
  accountType: 'CHECKING' | 'SAVINGS' | 'LOAN' | 'CREDIT_CARD' | 'INSTALLMENT_SAVINGS' | 'DEPOSIT';
  balance: number; // Negative for loans
  interestRate?: number; // % (for loans)
  monthlyPayment?: number; // For loan accounts
  dueDate?: Date; // Payment due date (for loans)
  currency: string;
}

/**
 * Non-bank debt (manually entered by user)
 */
export interface OtherDebt {
  creditor: string;
  amount: number;
  monthlyPayment: number;
  interestRate: number; // % annual rate
  loanType?: string; // e.g., "개인대출", "신용대출"
}

/**
 * Input data for debt analysis
 */
export interface DebtAnalysisInput {
  userId: string;
  monthlyIncome: number; // User's monthly income (₩)
  accounts: BankAccountInfo[]; // Synced bank accounts
  otherDebts?: OtherDebt[]; // Non-bank debts
  creditScore?: number; // If available (300-1000)
  additionalInfo?: Record<string, any>;
}

/**
 * Debt breakdown by type
 */
export interface DebtBreakdown {
  byType: {
    loans: {
      count: number;
      totalAmount: number;
      monthlyPayment: number;
    };
    creditCards: {
      count: number;
      totalAmount: number;
      monthlyPayment: number;
    };
    other: {
      count: number;
      totalAmount: number;
      monthlyPayment: number;
    };
  };
  byCreditor: Array<{
    name: string;
    amount: number;
    monthlyPayment: number;
    interestRate?: number;
  }>;
  largestDebt: {
    creditor: string;
    amount: number;
    percentage: number; // % of total debt
  };
}

/**
 * Analysis recommendation
 */
export interface AnalysisRecommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string; // Korean
  description: string; // Korean
  actionItems: string[]; // Korean
  category: 'IMMEDIATE' | 'SHORT_TERM' | 'LONG_TERM';
}

/**
 * Complete debt analysis result
 */
export interface DebtAnalysisResult {
  // Totals
  totalDebt: number; // ₩
  totalAssets: number; // ₩ (if any)
  monthlyPayment: number; // ₩ total monthly debt payment
  
  // Ratios
  dti: number; // Debt-to-Income ratio (%)
  dsr: number; // Debt Service Ratio (%)
  
  // Credit assessment
  creditScore?: number; // 300-1000
  creditGrade: CreditGrade; // AAA to D
  riskLevel: RiskLevel; // LOW, MEDIUM, HIGH, CRITICAL
  
  // Detailed breakdown
  breakdown: DebtBreakdown;
  
  // Recommendations
  recommendations: AnalysisRecommendation[];
  eligiblePrograms: string[]; // Array of program names user is eligible for
  
  // Metadata
  analyzedAt: Date;
  dataSource: {
    bankAccountsCount: number;
    otherDebtsCount: number;
  };
}

/**
 * Restructuring plan eligibility conditions
 */
export interface EligibilityConditions {
  minDebt?: number;
  maxDebt?: number;
  maxDTI?: number; // %
  minIncome?: number;
  maxIncome?: number;
  creditScoreRequired?: number;
  employmentRequired?: boolean;
  bankruptcyHistoryAllowed?: boolean;
  other?: string[]; // Additional conditions (Korean)
}

/**
 * Required documents for application
 */
export interface RequiredDocument {
  type: string; // e.g., "income_proof", "id_card"
  name: string; // Korean name
  description?: string; // Korean
  isMandatory: boolean;
}

/**
 * Restructuring plan simulation
 */
export interface RestructuringPlan {
  planType: PlanType;
  planName: string; // Korean
  planDescription: string; // Korean
  
  // Financial projections
  adjustedPayment: number; // ₩ new monthly payment
  adjustedInterestRate?: number; // % new interest rate
  estimatedPeriod: number; // months
  totalSavings?: number; // ₩ total amount saved over life of plan
  debtReductionRate?: number; // % of debt forgiven/reduced
  
  // Eligibility
  conditions: EligibilityConditions;
  requirements: RequiredDocument[];
  
  // Pros & Cons
  pros: string[]; // Korean
  cons: string[]; // Korean
  
  // Recommendation
  isRecommended: boolean; // Is this the best option?
  priority: number; // Display order (higher = show first)
  
  // Comparison metrics
  comparisonMetrics: {
    currentMonthlyPayment: number;
    newMonthlyPayment: number;
    monthlySavings: number;
    timeToDebtFree: number; // months
  };
}

/**
 * Complete analysis with plans
 */
export interface CompleteAnalysis {
  analysis: DebtAnalysisResult;
  plans: RestructuringPlan[];
}
