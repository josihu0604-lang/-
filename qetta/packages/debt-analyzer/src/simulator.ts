/**
 * Debt Simulator Module
 * 
 * Simulates restructuring plan outcomes and calculates financial projections
 */

import { PlanType, RestructuringPlan } from './types';

interface SimulationInput {
  currentDebt: number;
  currentMonthlyPayment: number;
  currentInterestRate: number;
  planType: PlanType;
  adjustedInterestRate?: number;
  adjustedPeriodMonths?: number;
  debtReductionRate?: number;
}

interface SimulationResult {
  originalPlan: {
    monthlyPayment: number;
    totalInterest: number;
    totalPayment: number;
    periodMonths: number;
  };
  adjustedPlan: {
    monthlyPayment: number;
    totalInterest: number;
    totalPayment: number;
    periodMonths: number;
  };
  savings: {
    monthlyPaymentReduction: number;
    totalInterestSaved: number;
    totalAmountSaved: number;
    debtForgiven: number;
  };
  breakEvenMonth: number; // When savings offset any fees
}

export class DebtSimulator {
  /**
   * Simulate a restructuring plan
   */
  static simulate(input: SimulationInput): SimulationResult {
    const originalPlan = this.calculateOriginalPlan(
      input.currentDebt,
      input.currentMonthlyPayment,
      input.currentInterestRate
    );
    
    const adjustedPlan = this.calculateAdjustedPlan(input);
    
    const debtForgiven = input.debtReductionRate 
      ? input.currentDebt * (input.debtReductionRate / 100)
      : 0;
    
    const savings = {
      monthlyPaymentReduction: originalPlan.monthlyPayment - adjustedPlan.monthlyPayment,
      totalInterestSaved: originalPlan.totalInterest - adjustedPlan.totalInterest,
      totalAmountSaved: originalPlan.totalPayment - adjustedPlan.totalPayment + debtForgiven,
      debtForgiven
    };
    
    // Calculate break-even point (typically 1-3 months for most programs)
    const breakEvenMonth = 2; // Simplified
    
    return {
      originalPlan,
      adjustedPlan,
      savings,
      breakEvenMonth
    };
  }
  
  /**
   * Calculate original payment plan projection
   */
  private static calculateOriginalPlan(
    principal: number,
    monthlyPayment: number,
    annualRate: number
  ): SimulationResult['originalPlan'] {
    const monthlyRate = annualRate / 12 / 100;
    
    // Estimate remaining months using amortization formula
    let remainingBalance = principal;
    let totalInterest = 0;
    let months = 0;
    
    // Cap at 360 months (30 years)
    while (remainingBalance > 0 && months < 360) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      
      if (principalPayment <= 0) {
        // Payment doesn't cover interest - debt will never be paid off
        months = 360;
        totalInterest = monthlyPayment * months - principal;
        break;
      }
      
      totalInterest += interestPayment;
      remainingBalance -= principalPayment;
      months++;
    }
    
    return {
      monthlyPayment,
      totalInterest: Math.round(totalInterest),
      totalPayment: Math.round(monthlyPayment * months),
      periodMonths: months
    };
  }
  
  /**
   * Calculate adjusted payment plan projection
   */
  private static calculateAdjustedPlan(input: SimulationInput): SimulationResult['adjustedPlan'] {
    let adjustedDebt = input.currentDebt;
    
    // Apply debt reduction if applicable
    if (input.debtReductionRate) {
      adjustedDebt = input.currentDebt * (1 - input.debtReductionRate / 100);
    }
    
    const periodMonths = input.adjustedPeriodMonths || 60;
    const annualRate = input.adjustedInterestRate || 5.0;
    const monthlyRate = annualRate / 12 / 100;
    
    // Calculate monthly payment using amortization formula
    // P = L[c(1 + c)^n]/[(1 + c)^n - 1]
    const monthlyPayment = monthlyRate > 0
      ? adjustedDebt * (monthlyRate * Math.pow(1 + monthlyRate, periodMonths)) / 
        (Math.pow(1 + monthlyRate, periodMonths) - 1)
      : adjustedDebt / periodMonths;
    
    const totalPayment = monthlyPayment * periodMonths;
    const totalInterest = totalPayment - adjustedDebt;
    
    return {
      monthlyPayment: Math.round(monthlyPayment),
      totalInterest: Math.round(totalInterest),
      totalPayment: Math.round(totalPayment),
      periodMonths
    };
  }
  
  /**
   * Simulate specific restructuring program
   */
  static simulateShinbok(currentDebt: number, currentPayment: number): RestructuringPlan['comparisonMetrics'] {
    const result = this.simulate({
      currentDebt,
      currentMonthlyPayment: currentPayment,
      currentInterestRate: 15.0, // Assumed high rate
      planType: PlanType.SHINBOK_PRE_WORKOUT,
      adjustedInterestRate: 5.0,
      adjustedPeriodMonths: 72,
      debtReductionRate: 0
    });
    
    return {
      currentMonthlyPayment: result.originalPlan.monthlyPayment,
      newMonthlyPayment: result.adjustedPlan.monthlyPayment,
      monthlySavings: result.savings.monthlyPaymentReduction,
      timeToDebtFree: result.adjustedPlan.periodMonths
    };
  }
  
  /**
   * Simulate Fresh Start Fund
   */
  static simulateFreshStart(currentDebt: number, currentPayment: number): RestructuringPlan['comparisonMetrics'] {
    const result = this.simulate({
      currentDebt,
      currentMonthlyPayment: currentPayment,
      currentInterestRate: 15.0,
      planType: PlanType.FRESH_START_FUND,
      adjustedInterestRate: 3.5,
      adjustedPeriodMonths: 96,
      debtReductionRate: 60 // 60% forgiveness
    });
    
    return {
      currentMonthlyPayment: result.originalPlan.monthlyPayment,
      newMonthlyPayment: result.adjustedPlan.monthlyPayment,
      monthlySavings: result.savings.monthlyPaymentReduction,
      timeToDebtFree: result.adjustedPlan.periodMonths
    };
  }
  
  /**
   * Simulate Individual Recovery
   */
  static simulateRecovery(currentDebt: number, currentPayment: number): RestructuringPlan['comparisonMetrics'] {
    const result = this.simulate({
      currentDebt,
      currentMonthlyPayment: currentPayment,
      currentInterestRate: 12.0,
      planType: PlanType.INDIVIDUAL_RECOVERY,
      adjustedInterestRate: 0, // No interest
      adjustedPeriodMonths: 60,
      debtReductionRate: 70 // 70% forgiveness
    });
    
    return {
      currentMonthlyPayment: result.originalPlan.monthlyPayment,
      newMonthlyPayment: result.adjustedPlan.monthlyPayment,
      monthlySavings: result.savings.monthlyPaymentReduction,
      timeToDebtFree: result.adjustedPlan.periodMonths
    };
  }
  
  /**
   * Generate amortization schedule
   */
  static generateAmortizationSchedule(
    principal: number,
    monthlyPayment: number,
    annualRate: number,
    maxMonths: number = 360
  ): Array<{
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }> {
    const schedule: Array<{
      month: number;
      payment: number;
      principal: number;
      interest: number;
      balance: number;
    }> = [];
    
    let balance = principal;
    const monthlyRate = annualRate / 12 / 100;
    
    for (let month = 1; month <= maxMonths && balance > 0; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = Math.min(monthlyPayment - interestPayment, balance);
      
      if (principalPayment <= 0) break;
      
      balance -= principalPayment;
      
      schedule.push({
        month,
        payment: monthlyPayment,
        principal: Math.round(principalPayment),
        interest: Math.round(interestPayment),
        balance: Math.round(balance)
      });
    }
    
    return schedule;
  }
  
  /**
   * Compare multiple plans side-by-side
   */
  static comparePlans(plans: RestructuringPlan[]): {
    bestForMonthlySavings: RestructuringPlan;
    bestForTotalSavings: RestructuringPlan;
    bestForShortestTime: RestructuringPlan;
    comparison: Array<{
      planName: string;
      monthlyPayment: number;
      monthlySavings: number;
      totalSavings: number;
      periodMonths: number;
      score: number; // Overall score (0-100)
    }>;
  } {
    if (plans.length === 0) {
      throw new Error('No plans to compare');
    }
    
    const comparison = plans.map(plan => {
      const monthlySavings = plan.comparisonMetrics.monthlySavings;
      const totalSavings = plan.totalSavings || 0;
      const periodMonths = plan.estimatedPeriod;
      
      // Calculate score (weighted average)
      const monthlySavingsScore = Math.min((monthlySavings / 500000) * 40, 40); // Max 40 points
      const totalSavingsScore = Math.min((totalSavings / 50000000) * 30, 30); // Max 30 points
      const timeScore = Math.max(30 - (periodMonths / 120) * 30, 0); // Max 30 points (shorter is better)
      const score = monthlySavingsScore + totalSavingsScore + timeScore;
      
      return {
        planName: plan.planName,
        monthlyPayment: plan.comparisonMetrics.newMonthlyPayment,
        monthlySavings,
        totalSavings,
        periodMonths,
        score: Math.round(score)
      };
    });
    
    // Sort to find best options
    const bestForMonthlySavings = plans.reduce((best, curr) => 
      curr.comparisonMetrics.monthlySavings > best.comparisonMetrics.monthlySavings ? curr : best
    );
    
    const bestForTotalSavings = plans.reduce((best, curr) => 
      (curr.totalSavings || 0) > (best.totalSavings || 0) ? curr : best
    );
    
    const bestForShortestTime = plans.reduce((best, curr) => 
      curr.estimatedPeriod < best.estimatedPeriod ? curr : best
    );
    
    return {
      bestForMonthlySavings,
      bestForTotalSavings,
      bestForShortestTime,
      comparison: comparison.sort((a, b) => b.score - a.score)
    };
  }
}
