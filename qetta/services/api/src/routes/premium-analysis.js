/**
 * Premium Analysis Routes
 * 
 * POST /premium/analyze - Full analysis with NICE API data
 * GET /premium/result/:analysisId - Get detailed 3-plan comparison
 * POST /premium/simulate - Simulate specific plan
 */

const DebtAnalyzer = require('../lib/debt-analyzer-wrapper');

/**
 * Mock NICE API credit data retrieval
 * In production, this would call actual NICE API
 */
async function getNICECreditData(phone, ciToken) {
  // TODO: Replace with actual NICE API call
  console.log(`[NICE API] Fetching credit data for ${phone} with CI token ${ciToken}`);
  
  // Return mock realistic data
  return {
    personalInfo: {
      name: '김**',
      birthDate: '1990-**-**',
      phone: phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-****-$3')
    },
    creditInfo: {
      creditScore: 750,
      creditGrade: 'BB',
      scoreDate: new Date().toISOString()
    },
    loans: [
      {
        type: 'LOAN',
        bankName: '국민은행',
        productName: '주택담보대출',
        amount: 45000000,
        balance: 42000000,
        monthlyPayment: 950000,
        interestRate: 4.2,
        loanDate: '2022-03-15',
        maturityDate: '2027-03-15'
      },
      {
        type: 'LOAN',
        bankName: '신한은행',
        productName: '신용대출',
        amount: 30000000,
        balance: 28500000,
        monthlyPayment: 750000,
        interestRate: 6.8,
        loanDate: '2023-06-01',
        maturityDate: '2026-06-01'
      },
      {
        type: 'LOAN',
        bankName: 'SBI저축은행',
        productName: '대부업 대출',
        amount: 18000000,
        balance: 17000000,
        monthlyPayment: 500000,
        interestRate: 15.9,
        loanDate: '2024-01-10',
        maturityDate: '2026-01-10'
      }
    ],
    creditCards: [
      {
        type: 'CREDIT_CARD',
        cardName: '신한카드',
        cardNumber: '5234-****-****-****',
        limit: 8000000,
        used: 5500000,
        monthlyPayment: 275000,
        interestRate: 18.0
      },
      {
        type: 'CREDIT_CARD',
        cardName: '삼성카드',
        cardNumber: '4578-****-****-****',
        limit: 5000000,
        used: 3200000,
        monthlyPayment: 160000,
        interestRate: 18.0
      },
      {
        type: 'CREDIT_CARD',
        cardName: '현대카드',
        cardNumber: '4321-****-****-****',
        limit: 3000000,
        used: 2100000,
        monthlyPayment: 105000,
        interestRate: 18.0
      }
    ],
    totalDebt: 97800000,
    totalMonthlyPayment: 2740000,
    dataSource: 'NICE_API',
    retrievedAt: new Date().toISOString()
  };
}

/**
 * Register routes
 */
async function premiumAnalysisRoutes(fastify, options) {
  
  /**
   * POST /premium/analyze
   * 
   * Premium analysis with NICE API real-time data
   */
  fastify.post('/analyze', {
    onRequest: [fastify.authenticate], // Requires authentication
    schema: {
      body: {
        type: 'object',
        required: ['monthlyIncome', 'phone'],
        properties: {
          monthlyIncome: { type: 'number', minimum: 0 },
          phone: { type: 'string' },
          ciToken: { type: 'string' } // From NICE verification
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const { monthlyIncome, phone, ciToken } = request.body;
      
      // Verify user has Premium subscription
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true
        }
      });
      
      if (!user) {
        return reply.code(404).send({
          error: 'USER_NOT_FOUND',
          message: '사용자를 찾을 수 없습니다'
        });
      }
      
      if (!user.subscription || user.subscription.status !== 'ACTIVE') {
        return reply.code(403).send({
          error: 'SUBSCRIPTION_REQUIRED',
          message: 'Premium 구독이 필요합니다'
        });
      }
      
      // Get NICE API credit data
      const niceData = await getNICECreditData(phone, ciToken);
      
      // Convert NICE data to analyzer format
      const analyzerInput = {
        monthlyIncome,
        creditScore: niceData.creditInfo.creditScore,
        accounts: [
          ...niceData.loans.map(loan => ({
            accountType: 'LOAN',
            bankName: loan.bankName,
            balance: -loan.balance, // Negative for debt
            monthlyPayment: loan.monthlyPayment,
            interestRate: loan.interestRate
          })),
          ...niceData.creditCards.map(card => ({
            accountType: 'CREDIT_CARD',
            bankName: card.cardName,
            balance: -card.used,
            monthlyPayment: card.monthlyPayment,
            interestRate: card.interestRate
          }))
        ]
      };
      
      // Run comprehensive analysis
      const analysis = DebtAnalyzer.analyze(analyzerInput);
      
      // Match ALL eligible policies (get top 3)
      const allPlans = DebtAnalyzer.matchPolicies(analysis, { monthlyIncome });
      const top3Plans = allPlans.slice(0, 3);
      
      // Run detailed simulations for each plan
      const detailedPlans = top3Plans.map(plan => {
        const simulation = DebtAnalyzer.simulate({
          currentDebt: analysis.totalDebt,
          currentMonthlyPayment: analysis.monthlyPayment,
          currentInterestRate: 10.0, // Average
          adjustedInterestRate: plan.adjustedInterestRate,
          adjustedPeriodMonths: plan.estimatedPeriod,
          debtReductionRate: plan.debtReductionRate
        });
        
        return {
          ...plan,
          simulation,
          monthlyReduction: simulation.savings.monthlyPaymentReduction,
          totalSavings: simulation.savings.totalAmountSaved,
          approvalProbability: calculateApprovalProbability(analysis, plan)
        };
      });
      
      // Create PremiumAnalysis record
      const premiumAnalysis = await fastify.prisma.debtAnalysis.create({
        data: {
          userId,
          monthlyIncome,
          totalDebt: analysis.totalDebt,
          totalAssets: analysis.totalAssets,
          monthlyPayment: analysis.monthlyPayment,
          dti: analysis.dti,
          dsr: analysis.dsr,
          creditScore: analysis.creditScore,
          creditGrade: analysis.creditGrade,
          riskLevel: analysis.riskLevel,
          breakdown: JSON.stringify(analysis.breakdown),
          recommendations: JSON.stringify(analysis.recommendations),
          eligiblePrograms: analysis.eligiblePrograms,
          status: 'COMPLETED',
          analyzedAt: new Date()
        }
      });
      
      // Store detailed plans
      await Promise.all(
        detailedPlans.map((plan, idx) =>
          fastify.prisma.restructuringPlan.create({
            data: {
              analysisId: premiumAnalysis.id,
              planType: plan.planType,
              planName: plan.planName,
              planDescription: plan.planDescription,
              adjustedPayment: plan.adjustedPayment,
              adjustedInterestRate: plan.adjustedInterestRate,
              estimatedPeriod: plan.estimatedPeriod,
              totalSavings: plan.totalSavings,
              debtReductionRate: plan.debtReductionRate,
              conditions: JSON.stringify(plan.conditions),
              requirements: JSON.stringify(plan.requirements),
              pros: plan.pros,
              cons: plan.cons,
              isRecommended: idx === 0, // First plan is recommended
              priority: plan.priority
            }
          })
        )
      );
      
      return {
        analysisId: premiumAnalysis.id,
        status: 'COMPLETED',
        summary: {
          totalDebt: analysis.totalDebt,
          monthlyPayment: analysis.monthlyPayment,
          dti: analysis.dti,
          creditScore: analysis.creditScore,
          creditGrade: analysis.creditGrade,
          riskLevel: analysis.riskLevel
        },
        plansCount: detailedPlans.length,
        dataSource: 'NICE_API',
        analyzedAt: premiumAnalysis.analyzedAt
      };
      
    } catch (error) {
      fastify.log.error('Premium analysis error:', error);
      
      return reply.code(500).send({
        error: 'ANALYSIS_FAILED',
        message: '분석 중 오류가 발생했습니다'
      });
    }
  });
  
  /**
   * GET /premium/result/:analysisId
   * 
   * Get detailed 3-plan comparison
   */
  fastify.get('/result/:analysisId', {
    onRequest: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          analysisId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const { analysisId } = request.params;
      
      // Find analysis with plans
      const analysis = await fastify.prisma.debtAnalysis.findUnique({
        where: { id: analysisId },
        include: {
          restructuringPlans: {
            orderBy: {
              priority: 'desc'
            }
          }
        }
      });
      
      if (!analysis) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message: '분석 결과를 찾을 수 없습니다'
        });
      }
      
      // Verify ownership
      if (analysis.userId !== userId) {
        return reply.code(403).send({
          error: 'FORBIDDEN',
          message: '접근 권한이 없습니다'
        });
      }
      
      // Parse JSON fields
      const breakdown = JSON.parse(analysis.breakdown);
      const recommendations = JSON.parse(analysis.recommendations);
      
      // Format plans
      const plans = analysis.restructuringPlans.map(plan => ({
        id: plan.id,
        planType: plan.planType,
        planName: plan.planName,
        planDescription: plan.planDescription,
        adjustedPayment: plan.adjustedPayment,
        adjustedInterestRate: plan.adjustedInterestRate,
        estimatedPeriod: plan.estimatedPeriod,
        totalSavings: plan.totalSavings,
        debtReductionRate: plan.debtReductionRate,
        conditions: JSON.parse(plan.conditions),
        requirements: JSON.parse(plan.requirements),
        pros: plan.pros,
        cons: plan.cons,
        isRecommended: plan.isRecommended,
        priority: plan.priority
      }));
      
      return {
        analysisId: analysis.id,
        analyzedAt: analysis.analyzedAt,
        summary: {
          totalDebt: analysis.totalDebt,
          totalAssets: analysis.totalAssets,
          monthlyPayment: analysis.monthlyPayment,
          monthlyIncome: analysis.monthlyIncome,
          dti: analysis.dti,
          dsr: analysis.dsr,
          creditScore: analysis.creditScore,
          creditGrade: analysis.creditGrade,
          riskLevel: analysis.riskLevel
        },
        breakdown,
        recommendations,
        eligiblePrograms: analysis.eligiblePrograms,
        plans,
        dataSource: 'NICE_API'
      };
      
    } catch (error) {
      fastify.log.error('Get premium result error:', error);
      
      return reply.code(500).send({
        error: 'FETCH_FAILED',
        message: '결과 조회 중 오류가 발생했습니다'
      });
    }
  });
  
  /**
   * POST /premium/simulate
   * 
   * Run detailed simulation for specific plan
   */
  fastify.post('/simulate', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['analysisId', 'planId'],
        properties: {
          analysisId: { type: 'string' },
          planId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const { analysisId, planId } = request.body;
      
      // Get analysis and plan
      const analysis = await fastify.prisma.debtAnalysis.findUnique({
        where: { id: analysisId }
      });
      
      const plan = await fastify.prisma.restructuringPlan.findUnique({
        where: { id: planId }
      });
      
      if (!analysis || !plan) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message: '분석 또는 플랜을 찾을 수 없습니다'
        });
      }
      
      // Verify ownership
      if (analysis.userId !== userId) {
        return reply.code(403).send({
          error: 'FORBIDDEN',
          message: '접근 권한이 없습니다'
        });
      }
      
      // Run detailed simulation
      const simulation = DebtAnalyzer.simulate({
        currentDebt: parseFloat(analysis.totalDebt.toString()),
        currentMonthlyPayment: parseFloat(analysis.monthlyPayment.toString()),
        currentInterestRate: 10.0,
        adjustedInterestRate: parseFloat(plan.adjustedInterestRate?.toString() || '5'),
        adjustedPeriodMonths: plan.estimatedPeriod,
        debtReductionRate: parseFloat(plan.debtReductionRate?.toString() || '0')
      });
      
      return {
        analysisId,
        planId,
        planName: plan.planName,
        simulation: {
          originalPlan: simulation.originalPlan,
          adjustedPlan: simulation.adjustedPlan,
          savings: simulation.savings,
          breakEvenMonth: simulation.breakEvenMonth
        },
        approvalProbability: calculateApprovalProbability(
          {
            dti: parseFloat(analysis.dti.toString()),
            totalDebt: parseFloat(analysis.totalDebt.toString()),
            monthlyIncome: parseFloat(analysis.monthlyIncome.toString()),
            creditScore: analysis.creditScore,
            creditGrade: analysis.creditGrade
          },
          plan
        )
      };
      
    } catch (error) {
      fastify.log.error('Simulation error:', error);
      
      return reply.code(500).send({
        error: 'SIMULATION_FAILED',
        message: '시뮬레이션 중 오류가 발생했습니다'
      });
    }
  });
}

/**
 * Calculate approval probability based on analysis and plan
 */
function calculateApprovalProbability(analysis, plan) {
  let probability = 50; // Base probability
  
  // Adjust based on DTI
  if (analysis.dti < 30) probability += 20;
  else if (analysis.dti < 40) probability += 10;
  else if (analysis.dti > 70) probability -= 20;
  
  // Adjust based on credit score
  if (analysis.creditScore >= 800) probability += 15;
  else if (analysis.creditScore >= 700) probability += 10;
  else if (analysis.creditScore < 600) probability -= 15;
  
  // Adjust based on debt amount
  const monthlyIncome = analysis.monthlyIncome || (analysis.monthlyPayment / (analysis.dti / 100));
  const debtToIncomeRatio = analysis.totalDebt / (monthlyIncome * 12);
  
  if (debtToIncomeRatio < 3) probability += 10;
  else if (debtToIncomeRatio > 10) probability -= 15;
  
  // Adjust based on plan type
  if (plan.planType === 'FRESH_START_FUND') probability -= 10; // More strict
  else if (plan.planType === 'SHINBOK_PRE_WORKOUT') probability += 5;
  
  // Clamp between 5% and 95%
  return Math.max(5, Math.min(95, probability));
}

module.exports = premiumAnalysisRoutes;
