/**
 * Free Tier Analysis Routes
 * 
 * POST /api/v1/free/analyze - Upload CreditForYou PDF and get basic analysis
 * GET /api/v1/free/result/:analysisId - Get analysis result (24h expiry)
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const pipeline = util.promisify(require('stream').pipeline);
const { extractCreditInfo, validateExtractedData } = require('../lib/ocr');
const DebtAnalyzer = require('../lib/debt-analyzer-wrapper');

/**
 * Register routes
 */
async function freeAnalysisRoutes(fastify, options) {
  
  /**
   * POST /api/v1/free/analyze
   * 
   * Upload CreditForYou PDF → OCR → Basic Analysis → Single Plan (Overview)
   */
  fastify.post('/analyze', {
    schema: {
      consumes: ['multipart/form-data'],
      response: {
        200: {
          type: 'object',
          properties: {
            analysisId: { type: 'string' },
            status: { type: 'string' },
            expiresAt: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // Get uploaded file
      const data = await request.file();
      
      if (!data) {
        return reply.code(400).send({
          error: 'FILE_REQUIRED',
          message: 'PDF 파일을 업로드해주세요'
        });
      }
      
      // Validate file type
      if (data.mimetype !== 'application/pdf') {
        return reply.code(400).send({
          error: 'INVALID_FILE_TYPE',
          message: 'PDF 파일만 업로드 가능합니다'
        });
      }
      
      // Save to temp directory
      const uploadsDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const filename = `${Date.now()}-${data.filename}`;
      const filepath = path.join(uploadsDir, filename);
      
      await pipeline(data.file, fs.createWriteStream(filepath));
      
      // Extract data using OCR
      let ocrData;
      try {
        ocrData = await extractCreditInfo(filepath);
      } catch (error) {
        // Clean up file
        fs.unlinkSync(filepath);
        
        return reply.code(500).send({
          error: 'OCR_FAILED',
          message: 'PDF 읽기에 실패했습니다. 크레딧포유 PDF인지 확인해주세요.'
        });
      }
      
      // Validate extracted data
      const validation = validateExtractedData(ocrData);
      if (!validation.valid) {
        // Clean up file
        fs.unlinkSync(filepath);
        
        return reply.code(400).send({
          error: 'INVALID_PDF_DATA',
          message: 'PDF에서 필요한 정보를 찾을 수 없습니다',
          details: validation.errors
        });
      }
      
      // Estimate monthly income (required for analysis)
      // Free tier: estimate based on DTI average (assume 40% DTI)
      const estimatedIncome = Math.round(ocrData.monthlyPayment / 0.4);
      
      // Convert OCR data to analyzer format
      const analyzerInput = {
        monthlyIncome: estimatedIncome,
        creditScore: ocrData.creditScore,
        accounts: [
          ...ocrData.loans.map((loan, idx) => ({
            accountType: 'LOAN',
            bankName: loan.bankName || `대출 ${idx + 1}`,
            balance: -loan.amount, // Negative for debt
            monthlyPayment: loan.monthlyPayment,
            interestRate: loan.interestRate || 8.0 // Estimated
          })),
          ...ocrData.creditCards.map((card, idx) => ({
            accountType: 'CREDIT_CARD',
            bankName: card.cardName || `카드 ${idx + 1}`,
            balance: -card.amount,
            monthlyPayment: card.monthlyPayment,
            interestRate: 18.0 // Typical credit card rate
          }))
        ]
      };
      
      // Run basic analysis
      const analysis = DebtAnalyzer.analyze(analyzerInput);
      
      // Match policies (get top 1 for free tier)
      const allPlans = DebtAnalyzer.matchPolicies(analysis, { monthlyIncome: estimatedIncome });
      const topPlan = allPlans.length > 0 ? allPlans[0] : null;
      
      // Create FREE tier plan (limited details)
      const freePlan = topPlan ? {
        planName: topPlan.planName,
        planDescription: topPlan.planDescription,
        estimatedSavings: `₩${(topPlan.totalSavings || 0).toLocaleString('ko-KR')}`,
        estimatedPeriod: `${topPlan.estimatedPeriod}개월`,
        // Limited info - no specific numbers
        benefits: [
          '월 상환액 감소',
          '금리 인하 가능',
          '상환 기간 조정'
        ],
        upgradeMessage: 'Premium으로 업그레이드하면 정확한 금액과 3가지 플랜을 비교할 수 있습니다'
      } : null;
      
      // Generate session ID (UUID)
      const sessionId = `free_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculate expiry (24 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      // Store in database
      const freeAnalysis = await fastify.prisma.freeAnalysis.create({
        data: {
          sessionId,
          ocrData: JSON.stringify(ocrData),
          basicAnalysis: JSON.stringify({
            totalDebt: analysis.totalDebt,
            monthlyPayment: analysis.monthlyPayment,
            estimatedIncome,
            dti: analysis.dti,
            creditScore: analysis.creditScore,
            creditGrade: analysis.creditGrade,
            riskLevel: analysis.riskLevel,
            breakdown: analysis.breakdown,
            topPlan: freePlan
          }),
          expiresAt
        }
      });
      
      // Clean up uploaded file
      fs.unlinkSync(filepath);
      
      return {
        analysisId: freeAnalysis.id,
        status: 'COMPLETED',
        expiresAt: expiresAt.toISOString()
      };
      
    } catch (error) {
      fastify.log.error('Free analysis error:', error);
      
      return reply.code(500).send({
        error: 'ANALYSIS_FAILED',
        message: '분석 중 오류가 발생했습니다'
      });
    }
  });
  
  /**
   * GET /api/v1/free/result/:analysisId
   * 
   * Get free tier analysis result (24h expiry)
   */
  fastify.get('/result/:analysisId', {
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
      const { analysisId } = request.params;
      
      // Find analysis
      const freeAnalysis = await fastify.prisma.freeAnalysis.findUnique({
        where: { id: analysisId }
      });
      
      if (!freeAnalysis) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message: '분석 결과를 찾을 수 없습니다'
        });
      }
      
      // Check expiry
      if (new Date() > freeAnalysis.expiresAt) {
        return reply.code(410).send({
          error: 'EXPIRED',
          message: '분석 결과가 만료되었습니다 (24시간 보관)',
          suggestPremium: true
        });
      }
      
      // Parse stored JSON
      const basicAnalysis = JSON.parse(freeAnalysis.basicAnalysis);
      
      return {
        analysisId: freeAnalysis.id,
        createdAt: freeAnalysis.createdAt,
        expiresAt: freeAnalysis.expiresAt,
        timeRemaining: Math.max(0, Math.floor((freeAnalysis.expiresAt - new Date()) / 1000 / 60)), // minutes
        
        // Basic debt summary
        summary: {
          totalDebt: basicAnalysis.totalDebt,
          monthlyPayment: basicAnalysis.monthlyPayment,
          estimatedIncome: basicAnalysis.estimatedIncome,
          dti: basicAnalysis.dti,
          creditScore: basicAnalysis.creditScore,
          creditGrade: basicAnalysis.creditGrade,
          riskLevel: basicAnalysis.riskLevel
        },
        
        // Debt breakdown
        breakdown: basicAnalysis.breakdown,
        
        // Single recommended plan (limited)
        recommendedPlan: basicAnalysis.topPlan,
        
        // Premium upgrade info
        premiumFeatures: {
          available: [
            'NICE API 실시간 정확한 신용정보',
            '3가지 플랜 상세 비교 분석',
            '신청서 PDF 자동 생성',
            'AI 승인 확률 예측',
            '6개월 데이터 보관',
            '1:1 전문가 상담'
          ],
          pricing: {
            basic: 19000,
            standard: 24000,
            premium: 29000
          }
        },
        
        // Data source info
        dataSource: {
          type: 'OCR',
          source: 'CreditForYou PDF',
          accuracy: 'estimated',
          note: 'OCR 추출 데이터로 추정치가 포함될 수 있습니다'
        }
      };
      
    } catch (error) {
      fastify.log.error('Get free result error:', error);
      
      return reply.code(500).send({
        error: 'FETCH_FAILED',
        message: '결과 조회 중 오류가 발생했습니다'
      });
    }
  });
}

module.exports = freeAnalysisRoutes;
