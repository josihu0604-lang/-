/**
 * Simplified Debt Analyzer Wrapper
 * 
 * JavaScript wrapper for the TypeScript debt-analyzer package
 * In production, this would import the compiled package
 */

class DebtAnalyzerWrapper {
  /**
   * Analyze debt and return results
   */
  static analyze(input) {
    const totalDebt = this.calculateTotalDebt(input);
    const totalAssets = this.calculateTotalAssets(input);
    const monthlyPayment = this.calculateMonthlyPayment(input);
    const dti = this.calculateDTI(input.monthlyIncome, monthlyPayment);
    const dsr = dti; // Simplified
    const creditGrade = this.estimateCreditGrade(input.creditScore, dti);
    const riskLevel = this.assessRiskLevel(dti, totalDebt, input.monthlyIncome);
    const breakdown = this.generateBreakdown(input);
    const recommendations = this.generateRecommendations({ dti, creditGrade, riskLevel, totalDebt, monthlyIncome: input.monthlyIncome });
    const eligiblePrograms = this.determineEligiblePrograms({ totalDebt, monthlyIncome: input.monthlyIncome, dti, creditGrade });
    
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
  
  static calculateTotalDebt(input) {
    let total = 0;
    for (const acc of input.accounts) {
      if (acc.balance < 0) total += Math.abs(acc.balance);
    }
    if (input.otherDebts) {
      for (const debt of input.otherDebts) {
        total += debt.amount;
      }
    }
    return total;
  }
  
  static calculateTotalAssets(input) {
    let total = 0;
    for (const acc of input.accounts) {
      if (acc.balance > 0) total += acc.balance;
    }
    return total;
  }
  
  static calculateMonthlyPayment(input) {
    let total = 0;
    for (const acc of input.accounts) {
      if (acc.monthlyPayment) total += acc.monthlyPayment;
    }
    if (input.otherDebts) {
      for (const debt of input.otherDebts) {
        total += debt.monthlyPayment;
      }
    }
    return total;
  }
  
  static calculateDTI(monthlyIncome, monthlyPayment) {
    if (monthlyIncome <= 0) return 999.99;
    return parseFloat(((monthlyPayment / monthlyIncome) * 100).toFixed(2));
  }
  
  static estimateCreditGrade(creditScore, dti) {
    if (creditScore) {
      if (creditScore >= 900) return 'AAA';
      if (creditScore >= 850) return 'AA';
      if (creditScore >= 800) return 'A';
      if (creditScore >= 750) return 'BBB';
      if (creditScore >= 700) return 'BB';
      if (creditScore >= 650) return 'B';
      if (creditScore >= 600) return 'CCC';
      if (creditScore >= 550) return 'CC';
      if (creditScore >= 500) return 'C';
      return 'D';
    }
    if (dti < 20) return 'A';
    if (dti < 30) return 'BBB';
    if (dti < 40) return 'BB';
    if (dti < 50) return 'B';
    if (dti < 60) return 'CCC';
    if (dti < 70) return 'CC';
    if (dti < 80) return 'C';
    return 'D';
  }
  
  static assessRiskLevel(dti, totalDebt, monthlyIncome) {
    if (dti > 70 || totalDebt > (monthlyIncome * 12 * 10)) return 'CRITICAL';
    if (dti > 50 || totalDebt > (monthlyIncome * 12 * 5)) return 'HIGH';
    if (dti > 30) return 'MEDIUM';
    return 'LOW';
  }
  
  static generateBreakdown(input) {
    const byType = { loans: { count: 0, totalAmount: 0, monthlyPayment: 0 }, creditCards: { count: 0, totalAmount: 0, monthlyPayment: 0 }, other: { count: 0, totalAmount: 0, monthlyPayment: 0 } };
    const byCreditor = [];
    
    for (const acc of input.accounts) {
      if (acc.balance >= 0) continue;
      const amount = Math.abs(acc.balance);
      const payment = acc.monthlyPayment || 0;
      if (acc.accountType === 'LOAN') {
        byType.loans.count++;
        byType.loans.totalAmount += amount;
        byType.loans.monthlyPayment += payment;
      } else if (acc.accountType === 'CREDIT_CARD') {
        byType.creditCards.count++;
        byType.creditCards.totalAmount += amount;
        byType.creditCards.monthlyPayment += payment;
      } else {
        byType.other.count++;
        byType.other.totalAmount += amount;
        byType.other.monthlyPayment += payment;
      }
      byCreditor.push({ name: acc.bankName, amount, monthlyPayment: payment, interestRate: acc.interestRate });
    }
    
    if (input.otherDebts) {
      for (const debt of input.otherDebts) {
        byType.other.count++;
        byType.other.totalAmount += debt.amount;
        byType.other.monthlyPayment += debt.monthlyPayment;
        byCreditor.push({ name: debt.creditor, amount: debt.amount, monthlyPayment: debt.monthlyPayment, interestRate: debt.interestRate });
      }
    }
    
    const totalDebt = byType.loans.totalAmount + byType.creditCards.totalAmount + byType.other.totalAmount;
    const largest = byCreditor.length > 0 ? byCreditor.reduce((max, curr) => curr.amount > max.amount ? curr : max) : { name: 'None', amount: 0 };
    
    return { byType, byCreditor, largestDebt: { creditor: largest.name, amount: largest.amount, percentage: totalDebt > 0 ? parseFloat(((largest.amount / totalDebt) * 100).toFixed(2)) : 0 } };
  }
  
  static generateRecommendations(ctx) {
    const recs = [];
    if (ctx.dti > 70) recs.push({ priority: 'HIGH', title: '즉시 채무조정 필요', description: 'DTI가 70%를 초과하여 즉각적인 채무조정이 필요합니다.', actionItems: ['신복위 프리워크아웃 신청', '개인회생 상담'], category: 'IMMEDIATE' });
    if (ctx.dti > 50 && ctx.dti <= 70) recs.push({ priority: 'HIGH', title: '채무 부담 경감 필요', description: 'DTI가 50%를 초과하여 채무 부담이 높습니다.', actionItems: ['새출발기금 신청', '고금리 전환'], category: 'SHORT_TERM' });
    if (ctx.dti < 30) recs.push({ priority: 'LOW', title: '양호한 재무 상태', description: 'DTI가 30% 미만으로 건강한 상태입니다.', actionItems: ['비상금 준비', '장기 계획 수립'], category: 'LONG_TERM' });
    return recs;
  }
  
  static determineEligiblePrograms(ctx) {
    const eligible = [];
    if (ctx.totalDebt >= 50000000 && ctx.totalDebt <= 1000000000 && ctx.monthlyIncome > 0 && ctx.dti > 30) eligible.push('신복위 프리워크아웃');
    if (ctx.totalDebt >= 50000000 && ctx.totalDebt <= 800000000 && ctx.monthlyIncome > 0 && ctx.monthlyIncome <= 3500000 && ctx.dti > 40) eligible.push('새출발기금');
    if (ctx.totalDebt >= 100000000 && ctx.totalDebt <= 1500000000 && ctx.monthlyIncome > 0) eligible.push('개인회생');
    if (ctx.dti > 80 || ctx.monthlyIncome < 1000000) eligible.push('개인파산');
    return eligible;
  }
  
  /**
   * Match policies to user's situation
   */
  static matchPolicies(analysis, context) {
    const plans = [];
    const ctx = { totalDebt: analysis.totalDebt, monthlyIncome: context.monthlyIncome, dti: analysis.dti, dsr: analysis.dsr, creditScore: analysis.creditScore, hasRegularIncome: true };
    
    // Shinbok
    if (ctx.totalDebt >= 50000000 && ctx.totalDebt <= 1000000000 && ctx.monthlyIncome > 0) {
      const currentPayment = (ctx.monthlyIncome * ctx.dti) / 100;
      const adjustedPayment = currentPayment * 0.65;
      plans.push({
        planType: 'SHINBOK_PRE_WORKOUT',
        planName: '신복위 프리워크아웃',
        planDescription: '신용회복위원회를 통한 채무조정',
        adjustedPayment: Math.round(adjustedPayment),
        adjustedInterestRate: 5.0,
        estimatedPeriod: 72,
        totalSavings: Math.round((currentPayment - adjustedPayment) * 72),
        debtReductionRate: 0,
        conditions: { minDebt: 50000000, maxDebt: 1000000000 },
        requirements: [{ type: 'id_card', name: '신분증', isMandatory: true }],
        pros: ['금리 인하', '상환기간 연장'],
        cons: ['원금 감면 없음'],
        isRecommended: ctx.dti >= 40 && ctx.dti <= 60,
        priority: 90
      });
    }
    
    // Fresh Start
    if (ctx.totalDebt >= 50000000 && ctx.totalDebt <= 800000000 && ctx.monthlyIncome <= 3500000) {
      plans.push({
        planType: 'FRESH_START_FUND',
        planName: '새출발기금',
        planDescription: '서민금융진흥원 지원',
        adjustedPayment: Math.round(ctx.totalDebt * 0.4 / 96),
        adjustedInterestRate: 3.5,
        estimatedPeriod: 96,
        totalSavings: Math.round(ctx.totalDebt * 0.6),
        debtReductionRate: 60,
        conditions: { minDebt: 50000000, maxDebt: 800000000 },
        requirements: [{ type: 'id_card', name: '신분증', isMandatory: true }],
        pros: ['최대 70% 감면', '저금리'],
        cons: ['심사 엄격'],
        isRecommended: ctx.monthlyIncome <= 2500000 && ctx.dti > 50,
        priority: 95
      });
    }
    
    return plans.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Simulate restructuring plan
   */
  static simulate(input) {
    const monthlyRate = input.currentInterestRate / 12 / 100;
    const originalPayment = input.currentMonthlyPayment;
    const originalMonths = 120; // Estimated
    
    const adjustedRate = (input.adjustedInterestRate || 5) / 12 / 100;
    const adjustedPeriod = input.adjustedPeriodMonths || 60;
    let adjustedDebt = input.currentDebt;
    if (input.debtReductionRate) adjustedDebt *= (1 - input.debtReductionRate / 100);
    
    const adjustedPayment = adjustedRate > 0
      ? adjustedDebt * (adjustedRate * Math.pow(1 + adjustedRate, adjustedPeriod)) / (Math.pow(1 + adjustedRate, adjustedPeriod) - 1)
      : adjustedDebt / adjustedPeriod;
    
    return {
      originalPlan: { monthlyPayment: originalPayment, totalInterest: originalPayment * originalMonths - input.currentDebt, totalPayment: originalPayment * originalMonths, periodMonths: originalMonths },
      adjustedPlan: { monthlyPayment: Math.round(adjustedPayment), totalInterest: Math.round(adjustedPayment * adjustedPeriod - adjustedDebt), totalPayment: Math.round(adjustedPayment * adjustedPeriod), periodMonths: adjustedPeriod },
      savings: { monthlyPaymentReduction: Math.round(originalPayment - adjustedPayment), totalInterestSaved: 0, totalAmountSaved: Math.round((originalPayment * originalMonths) - (adjustedPayment * adjustedPeriod)), debtForgiven: Math.round(input.currentDebt - adjustedDebt) },
      breakEvenMonth: 2
    };
  }
}

module.exports = DebtAnalyzerWrapper;
