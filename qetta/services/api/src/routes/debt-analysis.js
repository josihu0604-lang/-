/**
 * Debt Analysis API Routes
 * 
 * Handles debt analysis, restructuring plan generation, and simulations
 */

const { prisma } = require('../prisma');
const { z } = require('zod');
// Note: In production, this would be compiled TypeScript
// For now, we'll create a simplified JS wrapper
const DebtAnalyzer = require('../lib/debt-analyzer-wrapper');

module.exports = async function(app) {
  
  /**
   * POST /debt/analyze
   * Analyze user's debt and generate restructuring recommendations
   */
  app.post('/debt/analyze', {
    preHandler: app.authenticate
  }, async (req, reply) => {
    try {
      const schema = z.object({
        monthlyIncome: z.number().positive(),
        accountIds: z.array(z.string().uuid()).optional(),
        otherDebts: z.array(z.object({
          creditor: z.string(),
          amount: z.number().positive(),
          monthlyPayment: z.number().positive(),
          interestRate: z.number().min(0).max(100)
        })).optional(),
        creditScore: z.number().min(300).max(1000).optional()
      });
      
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: 'BAD_REQUEST',
          details: parsed.error.flatten()
        });
      }
      
      const { monthlyIncome, accountIds, otherDebts, creditScore } = parsed.data;
      const userId = req.user.id;
      
      // Get user's bank accounts
      const accounts = await prisma.bankAccount.findMany({
        where: {
          userId,
          ...(accountIds && accountIds.length > 0 && { id: { in: accountIds } })
        }
      });
      
      if (accounts.length === 0 && (!otherDebts || otherDebts.length === 0)) {
        return reply.code(400).send({
          error: 'NO_DEBT_DATA',
          message: 'No bank accounts or debts provided for analysis'
        });
      }
      
      // Convert accounts to analyzer input format
      const accountsInput = accounts.map(acc => ({
        id: acc.id,
        bankName: acc.bankName,
        accountNumber: acc.accountNumber,
        accountType: acc.accountType,
        balance: parseFloat(acc.balance),
        interestRate: acc.interestRate ? parseFloat(acc.interestRate) : undefined,
        monthlyPayment: acc.monthlyPayment ? parseFloat(acc.monthlyPayment) : undefined,
        dueDate: acc.dueDate,
        currency: acc.currency
      }));
      
      // Perform analysis
      const analysisResult = DebtAnalyzer.analyze({
        userId,
        monthlyIncome,
        accounts: accountsInput,
        otherDebts: otherDebts || [],
        creditScore
      });
      
      // Match to restructuring programs
      const plans = DebtAnalyzer.matchPolicies(analysisResult, { monthlyIncome });
      
      // Save to database
      const dbAnalysis = await prisma.debtAnalysis.create({
        data: {
          userId,
          monthlyIncome,
          otherDebts: otherDebts || [],
          totalDebt: analysisResult.totalDebt,
          totalAssets: analysisResult.totalAssets,
          monthlyPayment: analysisResult.monthlyPayment,
          dti: analysisResult.dti,
          dsr: analysisResult.dsr,
          creditScore: analysisResult.creditScore,
          creditGrade: analysisResult.creditGrade,
          riskLevel: analysisResult.riskLevel,
          breakdown: analysisResult.breakdown,
          recommendations: analysisResult.recommendations,
          eligiblePrograms: analysisResult.eligiblePrograms,
          status: 'COMPLETED',
          analyzedAt: new Date()
        }
      });
      
      // Save restructuring plans
      const dbPlans = await Promise.all(plans.map((plan, index) => 
        prisma.restructuringPlan.create({
          data: {
            analysisId: dbAnalysis.id,
            planType: plan.planType,
            planName: plan.planName,
            planDescription: plan.planDescription,
            adjustedPayment: plan.adjustedPayment,
            adjustedInterestRate: plan.adjustedInterestRate,
            estimatedPeriod: plan.estimatedPeriod,
            totalSavings: plan.totalSavings,
            debtReductionRate: plan.debtReductionRate,
            conditions: plan.conditions,
            requirements: plan.requirements,
            pros: plan.pros,
            cons: plan.cons,
            isRecommended: plan.isRecommended,
            priority: plan.priority
          }
        })
      ));
      
      return {
        analysisId: dbAnalysis.id,
        status: 'COMPLETED',
        summary: {
          totalDebt: analysisResult.totalDebt,
          dti: analysisResult.dti,
          creditGrade: analysisResult.creditGrade,
          riskLevel: analysisResult.riskLevel
        },
        plansCount: dbPlans.length,
        redirectUrl: `/result/${dbAnalysis.id}`
      };
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({
        error: 'ANALYSIS_FAILED',
        message: error.message
      });
    }
  });
  
  /**
   * GET /debt/analyses/:id
   * Get a specific debt analysis with plans
   */
  app.get('/debt/analyses/:id', {
    preHandler: app.authenticate
  }, async (req, reply) => {
    try {
      const { id } = req.params;
      
      const analysis = await prisma.debtAnalysis.findFirst({
        where: {
          id,
          userId: req.user.id
        },
        include: {
          restructuringPlans: {
            orderBy: [
              { isRecommended: 'desc' },
              { priority: 'desc' }
            ]
          }
        }
      });
      
      if (!analysis) {
        return reply.code(404).send({
          error: 'ANALYSIS_NOT_FOUND',
          message: 'Analysis not found or does not belong to you'
        });
      }
      
      return {
        analysis,
        plans: analysis.restructuringPlans
      };
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({
        error: 'FETCH_FAILED',
        message: error.message
      });
    }
  });
  
  /**
   * GET /debt/analyses
   * Get all debt analyses for authenticated user
   */
  app.get('/debt/analyses', {
    preHandler: app.authenticate
  }, async (req, reply) => {
    try {
      const schema = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(50).default(10)
      });
      
      const parsed = schema.safeParse(req.query);
      if (!parsed.success) {
        return reply.code(400).send({
          error: 'BAD_REQUEST',
          details: parsed.error.flatten()
        });
      }
      
      const { page, limit } = parsed.data;
      const skip = (page - 1) * limit;
      
      const where = { userId: req.user.id };
      
      const [analyses, total] = await Promise.all([
        prisma.debtAnalysis.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { restructuringPlans: true }
            }
          }
        }),
        prisma.debtAnalysis.count({ where })
      ]);
      
      return {
        analyses,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({
        error: 'FETCH_FAILED',
        message: error.message
      });
    }
  });
  
  /**
   * POST /debt/simulate
   * Simulate a specific restructuring plan
   */
  app.post('/debt/simulate', {
    preHandler: app.authenticate
  }, async (req, reply) => {
    try {
      const schema = z.object({
        currentDebt: z.number().positive(),
        currentMonthlyPayment: z.number().positive(),
        currentInterestRate: z.number().min(0).max(100),
        planType: z.enum(['SHINBOK_PRE_WORKOUT', 'FRESH_START_FUND', 'INDIVIDUAL_RECOVERY', 'INDIVIDUAL_BANKRUPTCY', 'CREDIT_ADJUSTMENT', 'CUSTOM']),
        adjustedInterestRate: z.number().min(0).max(100).optional(),
        adjustedPeriodMonths: z.number().min(1).max(360).optional(),
        debtReductionRate: z.number().min(0).max(100).optional()
      });
      
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: 'BAD_REQUEST',
          details: parsed.error.flatten()
        });
      }
      
      const simulation = DebtAnalyzer.simulate(parsed.data);
      
      return simulation;
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({
        error: 'SIMULATION_FAILED',
        message: error.message
      });
    }
  });
  
  /**
   * GET /debt/plans/:id
   * Get a specific restructuring plan
   */
  app.get('/debt/plans/:id', {
    preHandler: app.authenticate
  }, async (req, reply) => {
    try {
      const { id } = req.params;
      
      const plan = await prisma.restructuringPlan.findFirst({
        where: {
          id,
          analysis: {
            userId: req.user.id
          }
        },
        include: {
          analysis: {
            select: {
              totalDebt: true,
              monthlyIncome: true,
              dti: true,
              creditGrade: true
            }
          }
        }
      });
      
      if (!plan) {
        return reply.code(404).send({
          error: 'PLAN_NOT_FOUND',
          message: 'Plan not found or does not belong to you'
        });
      }
      
      return plan;
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({
        error: 'FETCH_FAILED',
        message: error.message
      });
    }
  });
};
