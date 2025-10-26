/**
 * Debt Analyzer Core Module
 * 
 * Calculates DTI, DSR, credit grade, and generates analysis recommendations
 */

import {
  DebtAnalysisInput,
  DebtAnalysisResult,
  DebtBreakdown,
  CreditGrade,
  RiskLevel,
  AnalysisRecommendation,
  BankAccountInfo,
  OtherDebt
} from './types';

export class DebtAnalyzer {
  /**
   * Main analysis function
   */
  static analyze(input: DebtAnalysisInput): DebtAnalysisResult {
    // Step 1: Calculate totals
    const totalDebt = this.calculateTotalDebt(input);
    const totalAssets = this.calculateTotalAssets(input);
    const monthlyPayment = this.calculateMonthlyPayment(input);
    
    // Step 2: Calculate ratios
    const dti = this.calculateDTI(input.monthlyIncome, monthlyPayment);
    const dsr = this.calculateDSR(input.monthlyIncome, monthlyPayment);
    
    // Step 3: Assess credit
    const creditGrade = this.estimateCreditGrade(input.creditScore, dti);
    const riskLevel = this.assessRiskLevel(dti, totalDebt, input.monthlyIncome);
    
    // Step 4: Generate breakdown
    const breakdown = this.generateBreakdown(input);
    
    // Step 5: Generate recommendations
    const recommendations = this.generateRecommendations({
      dti,
      dsr,
      creditGrade,
      riskLevel,
      totalDebt,
      monthlyIncome: input.monthlyIncome
    });
    
    // Step 6: Determine eligible programs
    const eligiblePrograms = this.determineEligiblePrograms({
      totalDebt,
      monthlyIncome: input.monthlyIncome,
      dti,
      creditGrade
    });
    
    return {
      totalDebt,
      totalAssets,
      monthlyPayment,
      dti,
      dsr,
      creditScore: input.creditScore,
      creditGrade,
      riskLevel,
      breakdown,
      recommendations,
      eligiblePrograms,
      analyzedAt: new Date(),
      dataSource: {
        bankAccountsCount: input.accounts.length,
        otherDebtsCount: input.otherDebts?.length || 0
      }
    };
  }
  
  /**
   * Calculate total debt from all sources
   */
  static calculateTotalDebt(input: DebtAnalysisInput): number {
    let total = 0;
    
    // Sum negative balances from bank accounts (loans, credit cards)
    for (const account of input.accounts) {
      if (account.balance < 0) {
        total += Math.abs(account.balance);
      }
    }
    
    // Add other debts
    if (input.otherDebts) {
      for (const debt of input.otherDebts) {
        total += debt.amount;
      }
    }
    
    return total;
  }
  
  /**
   * Calculate total assets (positive balances)
   */
  static calculateTotalAssets(input: DebtAnalysisInput): number {
    let total = 0;
    
    for (const account of input.accounts) {
      if (account.balance > 0) {
        total += account.balance;
      }
    }
    
    return total;
  }
  
  /**
   * Calculate total monthly debt payment
   */
  static calculateMonthlyPayment(input: DebtAnalysisInput): number {
    let total = 0;
    
    // Sum monthly payments from bank accounts
    for (const account of input.accounts) {
      if (account.monthlyPayment && account.monthlyPayment > 0) {
        total += account.monthlyPayment;
      }
    }
    
    // Add other debts' monthly payments
    if (input.otherDebts) {
      for (const debt of input.otherDebts) {
        total += debt.monthlyPayment;
      }
    }
    
    return total;
  }
  
  /**
   * Calculate Debt-to-Income ratio
   * DTI = (Total Monthly Debt Payment / Monthly Income) × 100
   */
  static calculateDTI(monthlyIncome: number, monthlyPayment: number): number {
    if (monthlyIncome <= 0) return 999.99; // Invalid income
    return parseFloat(((monthlyPayment / monthlyIncome) * 100).toFixed(2));
  }
  
  /**
   * Calculate Debt Service Ratio
   * DSR = Similar to DTI, includes all financial obligations
   */
  static calculateDSR(monthlyIncome: number, monthlyPayment: number): number {
    // For simplicity, DSR = DTI in this implementation
    // In real scenario, DSR might include rent, utilities, etc.
    return this.calculateDTI(monthlyIncome, monthlyPayment);
  }
  
  /**
   * Estimate credit grade based on credit score and DTI
   */
  static estimateCreditGrade(creditScore: number | undefined, dti: number): CreditGrade {
    // If credit score is provided, use it as primary factor
    if (creditScore) {
      if (creditScore >= 900) return CreditGrade.AAA;
      if (creditScore >= 850) return CreditGrade.AA;
      if (creditScore >= 800) return CreditGrade.A;
      if (creditScore >= 750) return CreditGrade.BBB;
      if (creditScore >= 700) return CreditGrade.BB;
      if (creditScore >= 650) return CreditGrade.B;
      if (creditScore >= 600) return CreditGrade.CCC;
      if (creditScore >= 550) return CreditGrade.CC;
      if (creditScore >= 500) return CreditGrade.C;
      return CreditGrade.D;
    }
    
    // Otherwise, estimate based on DTI
    if (dti < 20) return CreditGrade.A;
    if (dti < 30) return CreditGrade.BBB;
    if (dti < 40) return CreditGrade.BB;
    if (dti < 50) return CreditGrade.B;
    if (dti < 60) return CreditGrade.CCC;
    if (dti < 70) return CreditGrade.CC;
    if (dti < 80) return CreditGrade.C;
    return CreditGrade.D;
  }
  
  /**
   * Assess overall risk level
   */
  static assessRiskLevel(dti: number, totalDebt: number, monthlyIncome: number): RiskLevel {
    // Critical risk: DTI > 70% or debt > 10x annual income
    if (dti > 70 || totalDebt > (monthlyIncome * 12 * 10)) {
      return RiskLevel.CRITICAL;
    }
    
    // High risk: DTI > 50% or debt > 5x annual income
    if (dti > 50 || totalDebt > (monthlyIncome * 12 * 5)) {
      return RiskLevel.HIGH;
    }
    
    // Medium risk: DTI > 30%
    if (dti > 30) {
      return RiskLevel.MEDIUM;
    }
    
    // Low risk: DTI ≤ 30%
    return RiskLevel.LOW;
  }
  
  /**
   * Generate detailed debt breakdown
   */
  static generateBreakdown(input: DebtAnalysisInput): DebtBreakdown {
    const byType = {
      loans: { count: 0, totalAmount: 0, monthlyPayment: 0 },
      creditCards: { count: 0, totalAmount: 0, monthlyPayment: 0 },
      other: { count: 0, totalAmount: 0, monthlyPayment: 0 }
    };
    
    const byCreditor: Array<{ name: string; amount: number; monthlyPayment: number; interestRate?: number }> = [];
    
    // Process bank accounts
    for (const account of input.accounts) {
      if (account.balance >= 0) continue; // Skip assets
      
      const amount = Math.abs(account.balance);
      const payment = account.monthlyPayment || 0;
      
      if (account.accountType === 'LOAN') {
        byType.loans.count++;
        byType.loans.totalAmount += amount;
        byType.loans.monthlyPayment += payment;
      } else if (account.accountType === 'CREDIT_CARD') {
        byType.creditCards.count++;
        byType.creditCards.totalAmount += amount;
        byType.creditCards.monthlyPayment += payment;
      } else {
        byType.other.count++;
        byType.other.totalAmount += amount;
        byType.other.monthlyPayment += payment;
      }
      
      byCreditor.push({
        name: account.bankName,
        amount,
        monthlyPayment: payment,
        interestRate: account.interestRate
      });
    }
    
    // Process other debts
    if (input.otherDebts) {
      for (const debt of input.otherDebts) {
        byType.other.count++;
        byType.other.totalAmount += debt.amount;
        byType.other.monthlyPayment += debt.monthlyPayment;
        
        byCreditor.push({
          name: debt.creditor,
          amount: debt.amount,
          monthlyPayment: debt.monthlyPayment,
          interestRate: debt.interestRate
        });
      }
    }
    
    // Find largest debt
    const totalDebt = byType.loans.totalAmount + byType.creditCards.totalAmount + byType.other.totalAmount;
    const largest = byCreditor.reduce((max, curr) => curr.amount > max.amount ? curr : max, byCreditor[0] || { name: 'None', amount: 0 });
    
    return {
      byType,
      byCreditor,
      largestDebt: {
        creditor: largest.name,
        amount: largest.amount,
        percentage: totalDebt > 0 ? parseFloat(((largest.amount / totalDebt) * 100).toFixed(2)) : 0
      }
    };
  }
  
  /**
   * Generate analysis recommendations
   */
  static generateRecommendations(context: {
    dti: number;
    dsr: number;
    creditGrade: CreditGrade;
    riskLevel: RiskLevel;
    totalDebt: number;
    monthlyIncome: number;
  }): AnalysisRecommendation[] {
    const recommendations: AnalysisRecommendation[] = [];
    
    // Critical DTI
    if (context.dti > 70) {
      recommendations.push({
        priority: 'HIGH',
        title: '즉시 채무조정 필요',
        description: 'DTI가 70%를 초과하여 즉각적인 채무조정이 필요합니다. 신복위 프리워크아웃이나 개인회생을 고려하세요.',
        actionItems: [
          '신용회복위원회 프리워크아웃 신청 검토',
          '개인회생 절차 상담',
          '긴급 생활비 절감 계획 수립'
        ],
        category: 'IMMEDIATE'
      });
    }
    
    // High DTI
    if (context.dti > 50 && context.dti <= 70) {
      recommendations.push({
        priority: 'HIGH',
        title: '채무 부담 경감 방안 모색',
        description: 'DTI가 50%를 초과하여 채무 부담이 높습니다. 새출발기금이나 채무조정을 검토하세요.',
        actionItems: [
          '새출발기금 신청 자격 확인',
          '고금리 대출 저금리 전환 검토',
          '월 상환액 조정 가능 여부 확인'
        ],
        category: 'SHORT_TERM'
      });
    }
    
    // Low credit grade
    if ([CreditGrade.CCC, CreditGrade.CC, CreditGrade.C, CreditGrade.D].includes(context.creditGrade)) {
      recommendations.push({
        priority: 'MEDIUM',
        title: '신용등급 개선 필요',
        description: '현재 신용등급이 낮습니다. 연체 방지와 신용 관리가 필요합니다.',
        actionItems: [
          '모든 대출 정상 상환 유지',
          '신용카드 사용액 30% 이하 유지',
          '신규 대출 최소화'
        ],
        category: 'LONG_TERM'
      });
    }
    
    // Good DTI
    if (context.dti < 30) {
      recommendations.push({
        priority: 'LOW',
        title: '양호한 재무 상태 유지',
        description: 'DTI가 30% 미만으로 건강한 상태입니다. 현재 상태를 유지하세요.',
        actionItems: [
          '비상금 3-6개월치 준비',
          '장기 재무 계획 수립',
          '추가 저축 및 투자 고려'
        ],
        category: 'LONG_TERM'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Determine which restructuring programs user is eligible for
   */
  static determineEligiblePrograms(context: {
    totalDebt: number;
    monthlyIncome: number;
    dti: number;
    creditGrade: CreditGrade;
  }): string[] {
    const eligible: string[] = [];
    
    // 신복위 프리워크아웃: 채무 5천만원~10억, 소득 있음, DTI > 30%
    if (
      context.totalDebt >= 50_000_000 &&
      context.totalDebt <= 1_000_000_000 &&
      context.monthlyIncome > 0 &&
      context.dti > 30
    ) {
      eligible.push('신복위 프리워크아웃');
    }
    
    // 새출발기금: 채무 5천만원~8억, 소득 일정 이하, DTI > 40%
    if (
      context.totalDebt >= 50_000_000 &&
      context.totalDebt <= 800_000_000 &&
      context.monthlyIncome > 0 &&
      context.monthlyIncome <= 3_000_000 && // 월 소득 300만원 이하
      context.dti > 40
    ) {
      eligible.push('새출발기금');
    }
    
    // 개인회생: 채무 5억~15억, 정기 소득 있음
    if (
      context.totalDebt >= 100_000_000 &&
      context.totalDebt <= 1_500_000_000 &&
      context.monthlyIncome > 0
    ) {
      eligible.push('개인회생');
    }
    
    // 개인파산: 상환 능력 없음, DTI > 80%
    if (context.dti > 80 || context.monthlyIncome < 1_000_000) {
      eligible.push('개인파산');
    }
    
    // 신용회복: 낮은 신용등급, DTI > 40%
    if (
      [CreditGrade.CCC, CreditGrade.CC, CreditGrade.C, CreditGrade.D].includes(context.creditGrade) &&
      context.dti > 40
    ) {
      eligible.push('신용회복지원');
    }
    
    return eligible;
  }
}
