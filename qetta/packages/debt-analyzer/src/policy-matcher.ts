/**
 * Policy Matcher Module
 * 
 * Matches users to appropriate debt restructuring programs
 * Based on eligibility criteria for Korean programs
 */

import {
  DebtAnalysisResult,
  PlanType,
  RestructuringPlan,
  EligibilityConditions,
  RequiredDocument
} from './types';

interface MatchContext {
  totalDebt: number;
  monthlyIncome: number;
  dti: number;
  dsr: number;
  creditScore?: number;
  hasRegularIncome: boolean;
  employmentStatus?: 'EMPLOYED' | 'SELF_EMPLOYED' | 'UNEMPLOYED';
  age?: number;
}

export class PolicyMatcher {
  /**
   * Match all applicable programs
   */
  static matchAll(analysis: DebtAnalysisResult, context: Partial<MatchContext>): RestructuringPlan[] {
    const plans: RestructuringPlan[] = [];
    
    const fullContext: MatchContext = {
      totalDebt: analysis.totalDebt,
      monthlyIncome: 0,
      dti: analysis.dti,
      dsr: analysis.dsr,
      creditScore: analysis.creditScore,
      hasRegularIncome: true,
      ...context
    };
    
    // Check each program
    const shinbokMatch = this.matchShinbokPreWorkout(fullContext);
    if (shinbokMatch) plans.push(shinbokMatch);
    
    const freshStartMatch = this.matchFreshStartFund(fullContext);
    if (freshStartMatch) plans.push(freshStartMatch);
    
    const recoveryMatch = this.matchIndividualRecovery(fullContext);
    if (recoveryMatch) plans.push(recoveryMatch);
    
    const bankruptcyMatch = this.matchBankruptcy(fullContext);
    if (bankruptcyMatch) plans.push(bankruptcyMatch);
    
    const creditAdjustMatch = this.matchCreditAdjustment(fullContext);
    if (creditAdjustMatch) plans.push(creditAdjustMatch);
    
    // Sort by priority (recommended first)
    return plans.sort((a, b) => {
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      return b.priority - a.priority;
    });
  }
  
  /**
   * 신복위 프리워크아웃 (Credit Counseling Pre-Workout)
   */
  static matchShinbokPreWorkout(context: MatchContext): RestructuringPlan | null {
    // Eligibility: 채무 5천만원~10억, 소득 있음, 연체 90일 이내
    const eligible = 
      context.totalDebt >= 50_000_000 &&
      context.totalDebt <= 1_000_000_000 &&
      context.hasRegularIncome &&
      context.monthlyIncome > 0;
    
    if (!eligible) return null;
    
    // Calculate adjusted payment (30-50% reduction typical)
    const reductionRate = 0.35; // 35% reduction
    const currentPayment = (context.monthlyIncome * context.dti) / 100;
    const adjustedPayment = currentPayment * (1 - reductionRate);
    
    // Estimate period (5-8 years typical)
    const estimatedPeriod = 72; // 6 years
    
    const conditions: EligibilityConditions = {
      minDebt: 50_000_000,
      maxDebt: 1_000_000_000,
      minIncome: 1_000_000,
      employmentRequired: true,
      bankruptcyHistoryAllowed: false,
      other: [
        '연체기간 90일 이내',
        '신용회복위원회 미등록자',
        '성실한 상환 의지 있는 자'
      ]
    };
    
    const requirements: RequiredDocument[] = [
      { type: 'id_card', name: '신분증', isMandatory: true },
      { type: 'income_proof', name: '소득증빙서류 (재직증명서, 급여명세서)', isMandatory: true },
      { type: 'debt_proof', name: '채무확인서 (금융거래확인서)', isMandatory: true },
      { type: 'family_cert', name: '가족관계증명서', isMandatory: true },
      { type: 'residence_cert', name: '주민등록등본', isMandatory: true }
    ];
    
    return {
      planType: PlanType.SHINBOK_PRE_WORKOUT,
      planName: '신복위 프리워크아웃',
      planDescription: '신용회복위원회를 통한 채무조정 프로그램입니다. 금리 인하와 상환기간 연장을 통해 월 상환액을 줄일 수 있습니다.',
      adjustedPayment: Math.round(adjustedPayment),
      adjustedInterestRate: 5.0, // Typical 5% fixed rate
      estimatedPeriod,
      totalSavings: Math.round((currentPayment - adjustedPayment) * estimatedPeriod),
      debtReductionRate: 0, // No principal reduction
      conditions,
      requirements,
      pros: [
        '금리를 5% 수준으로 인하',
        '상환기간 최대 8년 연장 가능',
        '신용등급 회복 가능',
        '법원 절차 불필요',
        '빠른 처리 (1-2개월)'
      ],
      cons: [
        '원금 감면 없음',
        '신규 대출 제한 (프로그램 기간 중)',
        '성실 상환 필수',
        '중도 이탈 시 불이익'
      ],
      isRecommended: context.dti >= 40 && context.dti <= 60,
      priority: 90,
      comparisonMetrics: {
        currentMonthlyPayment: Math.round(currentPayment),
        newMonthlyPayment: Math.round(adjustedPayment),
        monthlySavings: Math.round(currentPayment - adjustedPayment),
        timeToDebtFree: estimatedPeriod
      }
    };
  }
  
  /**
   * 새출발기금 (Fresh Start Fund)
   */
  static matchFreshStartFund(context: MatchContext): RestructuringPlan | null {
    // Eligibility: 채무 5천만원~8억, 저소득층, 장기연체자
    const eligible = 
      context.totalDebt >= 50_000_000 &&
      context.totalDebt <= 800_000_000 &&
      context.monthlyIncome > 0 &&
      context.monthlyIncome <= 3_500_000; // 월 소득 350만원 이하
    
    if (!eligible) return null;
    
    // Calculate adjusted payment (최대 70% 감면 가능)
    const reductionRate = 0.60; // 60% reduction
    const currentPayment = (context.monthlyIncome * context.dti) / 100;
    const adjustedPayment = context.totalDebt * 0.4 / 96; // 40% of debt over 8 years
    
    const estimatedPeriod = 96; // 8 years
    
    const conditions: EligibilityConditions = {
      minDebt: 50_000_000,
      maxDebt: 800_000_000,
      maxIncome: 3_500_000,
      minIncome: 500_000,
      other: [
        '연체기간 3개월 이상',
        '저소득 취약계층',
        '만 19세 이상',
        '신용회복지원 이력 없음'
      ]
    };
    
    const requirements: RequiredDocument[] = [
      { type: 'id_card', name: '신분증', isMandatory: true },
      { type: 'income_proof', name: '소득증빙서류', isMandatory: true },
      { type: 'debt_proof', name: '채무확인서', isMandatory: true },
      { type: 'family_cert', name: '가족관계증명서', isMandatory: true },
      { type: 'asset_proof', name: '재산증명서', isMandatory: true },
      { type: 'health_insurance', name: '건강보험자격득실확인서', isMandatory: false }
    ];
    
    return {
      planType: PlanType.FRESH_START_FUND,
      planName: '새출발기금',
      planDescription: '서민금융진흥원의 저소득 취약계층 지원 프로그램입니다. 최대 70%까지 채무 감면이 가능합니다.',
      adjustedPayment: Math.round(adjustedPayment),
      adjustedInterestRate: 3.5, // Very low interest rate
      estimatedPeriod,
      totalSavings: Math.round(context.totalDebt * 0.6), // 60% forgiveness
      debtReductionRate: 60,
      conditions,
      requirements,
      pros: [
        '최대 70% 원금 감면',
        '저금리 3.5% 적용',
        '최장 8년 분할상환',
        '신용회복 지원',
        '법률·재무 상담 무료 제공'
      ],
      cons: [
        '소득 및 재산 요건 엄격',
        '심사 기간 2-3개월 소요',
        '승인률 약 60%',
        '지원금액 한도 있음',
        '1회 지원 원칙'
      ],
      isRecommended: context.monthlyIncome <= 2_500_000 && context.dti > 50,
      priority: 95,
      comparisonMetrics: {
        currentMonthlyPayment: Math.round(currentPayment),
        newMonthlyPayment: Math.round(adjustedPayment),
        monthlySavings: Math.round(currentPayment - adjustedPayment),
        timeToDebtFree: estimatedPeriod
      }
    };
  }
  
  /**
   * 개인회생 (Individual Recovery)
   */
  static matchIndividualRecovery(context: MatchContext): RestructuringPlan | null {
    // Eligibility: 채무 10억~15억, 정기 소득 있음
    const eligible = 
      context.totalDebt >= 100_000_000 &&
      context.totalDebt <= 1_500_000_000 &&
      context.hasRegularIncome;
    
    if (!eligible) return null;
    
    // Calculate adjusted payment (변제율 통상 20-50%)
    const repaymentRate = 0.30; // 30% repayment
    const adjustedPayment = (context.totalDebt * repaymentRate) / 60; // Over 5 years
    
    const estimatedPeriod = 60; // 5 years
    
    const conditions: EligibilityConditions = {
      minDebt: 10_000_000,
      maxDebt: 1_500_000_000,
      employmentRequired: true,
      minIncome: 1_000_000,
      other: [
        '정기적 소득 필수',
        '담보부채무 10억원, 무담보채무 5억원 한도',
        '파산 원인 없을 것'
      ]
    };
    
    const requirements: RequiredDocument[] = [
      { type: 'id_card', name: '신분증', isMandatory: true },
      { type: 'income_proof', name: '소득증빙서류 (최근 3개월)', isMandatory: true },
      { type: 'debt_list', name: '채권자 목록 및 채무액 확인서', isMandatory: true },
      { type: 'asset_list', name: '재산목록', isMandatory: true },
      { type: 'family_cert', name: '가족관계증명서', isMandatory: true },
      { type: 'residence_cert', name: '주민등록등본', isMandatory: true },
      { type: 'bankruptcy_stmt', name: '파산·회생 사유서', isMandatory: true }
    ];
    
    return {
      planType: PlanType.INDIVIDUAL_RECOVERY,
      planName: '개인회생',
      planDescription: '법원을 통한 공적 채무조정 절차입니다. 채무의 일부만 변제하고 나머지는 면책받을 수 있습니다.',
      adjustedPayment: Math.round(adjustedPayment),
      adjustedInterestRate: 0, // No interest during repayment
      estimatedPeriod,
      totalSavings: Math.round(context.totalDebt * (1 - repaymentRate)),
      debtReductionRate: (1 - repaymentRate) * 100,
      conditions,
      requirements,
      pros: [
        '채무의 70-80% 면책 가능',
        '이자 및 연체료 면제',
        '급여 압류 중지',
        '신용회복 가능 (완납 후 5년)',
        '법적 보호'
      ],
      cons: [
        '법원 절차 필요 (6-12개월)',
        '신용정보 등록 (5년)',
        '비용 발생 (변호사 수임료 등)',
        '성실 변제 의무',
        '관재인 감독'
      ],
      isRecommended: context.totalDebt >= 300_000_000 && context.hasRegularIncome,
      priority: 80,
      comparisonMetrics: {
        currentMonthlyPayment: Math.round((context.monthlyIncome * context.dti) / 100),
        newMonthlyPayment: Math.round(adjustedPayment),
        monthlySavings: Math.round((context.monthlyIncome * context.dti) / 100 - adjustedPayment),
        timeToDebtFree: estimatedPeriod
      }
    };
  }
  
  /**
   * 개인파산 (Individual Bankruptcy)
   */
  static matchBankruptcy(context: MatchContext): RestructuringPlan | null {
    // Eligibility: 상환 능력 전혀 없음
    const eligible = 
      (context.dti > 90 || context.monthlyIncome < 1_000_000) &&
      context.totalDebt > 10_000_000;
    
    if (!eligible) return null;
    
    const conditions: EligibilityConditions = {
      minDebt: 10_000_000,
      minIncome: 0,
      other: [
        '지급불능 상태 (변제능력 없음)',
        '도박 등 사행성 채무 제한',
        '사기적 채무 불가'
      ]
    };
    
    const requirements: RequiredDocument[] = [
      { type: 'id_card', name: '신분증', isMandatory: true },
      { type: 'debt_list', name: '채권자 목록', isMandatory: true },
      { type: 'asset_list', name: '재산목록', isMandatory: true },
      { type: 'income_proof', name: '소득 및 생계비 증빙', isMandatory: true },
      { type: 'bankruptcy_reason', name: '파산 사유서', isMandatory: true },
      { type: 'family_cert', name: '가족관계증명서', isMandatory: true }
    ];
    
    return {
      planType: PlanType.INDIVIDUAL_BANKRUPTCY,
      planName: '개인파산 및 면책',
      planDescription: '법원의 파산선고를 통해 모든 채무를 면책받는 최종 수단입니다.',
      adjustedPayment: 0,
      adjustedInterestRate: 0,
      estimatedPeriod: 0,
      totalSavings: context.totalDebt,
      debtReductionRate: 100,
      conditions,
      requirements,
      pros: [
        '모든 채무 면책 (100%)',
        '즉시 채무 추심 중단',
        '새로운 경제생활 시작 가능',
        '법적 보호'
      ],
      cons: [
        '신용정보 등록 (7-10년)',
        '직업 제한 (공무원, 변호사 등 일부 직종)',
        '재산 처분 (최소 생계비 제외)',
        '해외여행 제한 (절차 중)',
        '사회적 낙인',
        '10년 내 재신청 불가'
      ],
      isRecommended: context.monthlyIncome < 1_000_000 && context.totalDebt > 100_000_000,
      priority: 60,
      comparisonMetrics: {
        currentMonthlyPayment: Math.round((context.monthlyIncome * context.dti) / 100),
        newMonthlyPayment: 0,
        monthlySavings: Math.round((context.monthlyIncome * context.dti) / 100),
        timeToDebtFree: 12 // 절차 기간
      }
    };
  }
  
  /**
   * 신용회복 (Credit Adjustment)
   */
  static matchCreditAdjustment(context: MatchContext): RestructuringPlan | null {
    // Eligibility: 저신용자, DTI 40% 이상
    const eligible = 
      context.totalDebt >= 10_000_000 &&
      context.totalDebt <= 500_000_000 &&
      context.dti >= 35;
    
    if (!eligible) return null;
    
    const reductionRate = 0.25; // 25% reduction
    const currentPayment = (context.monthlyIncome * context.dti) / 100;
    const adjustedPayment = currentPayment * (1 - reductionRate);
    const estimatedPeriod = 60; // 5 years
    
    const conditions: EligibilityConditions = {
      minDebt: 10_000_000,
      maxDebt: 500_000_000,
      maxDTI: 80,
      other: [
        '연체 이력 있는 자',
        '저신용자',
        '상환 의지 있는 자'
      ]
    };
    
    const requirements: RequiredDocument[] = [
      { type: 'id_card', name: '신분증', isMandatory: true },
      { type: 'income_proof', name: '소득증빙서류', isMandatory: true },
      { type: 'debt_proof', name: '채무확인서', isMandatory: true },
      { type: 'residence_cert', name: '주민등록등본', isMandatory: false }
    ];
    
    return {
      planType: PlanType.CREDIT_ADJUSTMENT,
      planName: '신용회복지원',
      planDescription: '신용회복위원회를 통한 채무 재조정 프로그램입니다.',
      adjustedPayment: Math.round(adjustedPayment),
      adjustedInterestRate: 6.0,
      estimatedPeriod,
      totalSavings: Math.round((currentPayment - adjustedPayment) * estimatedPeriod),
      debtReductionRate: 0,
      conditions,
      requirements,
      pros: [
        '금리 인하 (6% 수준)',
        '연체이자 감면',
        '상환기간 연장',
        '신용등급 회복 지원',
        '간편한 절차'
      ],
      cons: [
        '원금 감면 없음',
        '신규 대출 제한',
        '성실 상환 필수',
        '프로그램 이탈 시 불이익'
      ],
      isRecommended: context.dti >= 35 && context.dti <= 50,
      priority: 70,
      comparisonMetrics: {
        currentMonthlyPayment: Math.round(currentPayment),
        newMonthlyPayment: Math.round(adjustedPayment),
        monthlySavings: Math.round(currentPayment - adjustedPayment),
        timeToDebtFree: estimatedPeriod
      }
    };
  }
}
