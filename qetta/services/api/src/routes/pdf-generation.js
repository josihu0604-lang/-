/**
 * PDF Generation API Routes
 * 
 * Endpoints for generating application documents for debt restructuring programs
 */

const path = require('path');
const fs = require('fs');
const {
  generateApplicationPDF,
  getPDFDirectory,
  generatePDFFilename
} = require('../lib/pdf-generator');

/**
 * @param {import('fastify').FastifyInstance} fastify
 */
async function pdfGenerationRoutes(fastify) {
  
  /**
   * POST /api/v1/pdf/generate
   * 
   * Generate PDF application document for selected plan
   * 
   * Request Body:
   * {
   *   "analysisId": "uuid",
   *   "planType": "SHINBOK_PRE_WORKOUT" | "FRESH_START_FUND" | "INDIVIDUAL_RECOVERY"
   * }
   * 
   * Response:
   * {
   *   "success": true,
   *   "pdfUrl": "/api/v1/pdf/download/{filename}",
   *   "filename": "application-shinbok-pre-workout-{userId}-{timestamp}.pdf",
   *   "planType": "SHINBOK_PRE_WORKOUT"
   * }
   */
  fastify.post('/pdf/generate', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    try {
      const { analysisId, planType } = request.body;
      const userId = request.user.userId;
      
      // Validation
      if (!analysisId || !planType) {
        return reply.status(400).send({
          success: false,
          error: 'MISSING_PARAMETERS',
          message: 'analysisId and planType are required'
        });
      }
      
      const validPlanTypes = ['SHINBOK_PRE_WORKOUT', 'FRESH_START_FUND', 'INDIVIDUAL_RECOVERY', 'INDIVIDUAL_BANKRUPTCY'];
      if (!validPlanTypes.includes(planType)) {
        return reply.status(400).send({
          success: false,
          error: 'INVALID_PLAN_TYPE',
          message: `planType must be one of: ${validPlanTypes.join(', ')}`
        });
      }
      
      // Fetch analysis data from database
      const analysis = await fastify.prisma.premiumAnalysis.findUnique({
        where: { id: analysisId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true
            }
          }
        }
      });
      
      if (!analysis) {
        return reply.status(404).send({
          success: false,
          error: 'ANALYSIS_NOT_FOUND',
          message: 'Analysis not found'
        });
      }
      
      // Verify ownership
      if (analysis.userId !== userId) {
        return reply.status(403).send({
          success: false,
          error: 'FORBIDDEN',
          message: 'You do not have permission to access this analysis'
        });
      }
      
      // Check Premium tier
      if (analysis.user.tier !== 'PREMIUM') {
        return reply.status(403).send({
          success: false,
          error: 'PREMIUM_REQUIRED',
          message: 'PDF generation is only available for Premium users'
        });
      }
      
      // Find selected plan in analysis results
      const results = analysis.results;
      const selectedPlan = results.plans?.find(p => p.planType === planType);
      
      if (!selectedPlan) {
        return reply.status(404).send({
          success: false,
          error: 'PLAN_NOT_FOUND',
          message: 'Selected plan not found in analysis results'
        });
      }
      
      // Prepare analysis data for PDF generation
      const analysisData = {
        userName: analysis.user.name || '',
        phone: analysis.user.phone || results.phone || '',
        email: analysis.user.email || '',
        summary: {
          totalDebt: results.summary.totalDebt,
          monthlyPayment: results.summary.monthlyPayment,
          monthlyIncome: results.summary.monthlyIncome,
          dti: results.summary.dti,
          creditScore: results.summary.creditScore,
          totalAssets: results.summary.totalAssets || 0
        },
        breakdown: {
          byCreditor: results.breakdown?.byCreditor || []
        },
        selectedPlan: {
          adjustedPayment: selectedPlan.adjustedPayment,
          adjustedInterestRate: selectedPlan.adjustedInterestRate,
          estimatedPeriod: selectedPlan.estimatedPeriod,
          totalSavings: selectedPlan.totalSavings
        },
        plan: selectedPlan
      };
      
      // Generate PDF filename and path
      const filename = generatePDFFilename(userId, planType);
      const pdfDir = getPDFDirectory();
      const outputPath = path.join(pdfDir, filename);
      
      // Generate PDF
      await generateApplicationPDF(analysisData, planType, outputPath);
      
      // Save PDF record to database
      const pdfRecord = await fastify.prisma.generatedPDF.create({
        data: {
          userId: userId,
          analysisId: analysisId,
          planType: planType,
          filename: filename,
          filePath: outputPath,
          status: 'COMPLETED'
        }
      });
      
      fastify.log.info(`PDF generated successfully: ${filename} for user ${userId}`);
      
      return reply.status(200).send({
        success: true,
        pdfId: pdfRecord.id,
        pdfUrl: `/api/v1/pdf/download/${filename}`,
        filename: filename,
        planType: planType,
        createdAt: pdfRecord.createdAt
      });
      
    } catch (error) {
      fastify.log.error('PDF generation error:', error);
      return reply.status(500).send({
        success: false,
        error: 'PDF_GENERATION_FAILED',
        message: 'Failed to generate PDF document',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
  
  /**
   * GET /api/v1/pdf/download/:filename
   * 
   * Download generated PDF file
   * 
   * Response: PDF file stream
   */
  fastify.get('/pdf/download/:filename', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    try {
      const { filename } = request.params;
      const userId = request.user.userId;
      
      // Validate filename (security check)
      if (!filename || !/^application-[\w-]+-[\w-]+-\d+\.pdf$/.test(filename)) {
        return reply.status(400).send({
          success: false,
          error: 'INVALID_FILENAME',
          message: 'Invalid PDF filename'
        });
      }
      
      // Check if PDF exists in database and belongs to user
      const pdfRecord = await fastify.prisma.generatedPDF.findFirst({
        where: {
          filename: filename,
          userId: userId
        }
      });
      
      if (!pdfRecord) {
        return reply.status(404).send({
          success: false,
          error: 'PDF_NOT_FOUND',
          message: 'PDF not found or access denied'
        });
      }
      
      const pdfPath = pdfRecord.filePath;
      
      // Check if file exists
      if (!fs.existsSync(pdfPath)) {
        fastify.log.error(`PDF file not found on disk: ${pdfPath}`);
        return reply.status(404).send({
          success: false,
          error: 'FILE_NOT_FOUND',
          message: 'PDF file not found on server'
        });
      }
      
      // Stream PDF file
      const stream = fs.createReadStream(pdfPath);
      
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
      
      return reply.send(stream);
      
    } catch (error) {
      fastify.log.error('PDF download error:', error);
      return reply.status(500).send({
        success: false,
        error: 'DOWNLOAD_FAILED',
        message: 'Failed to download PDF'
      });
    }
  });
  
  /**
   * GET /api/v1/pdf/history
   * 
   * Get PDF generation history for current user
   * 
   * Response:
   * {
   *   "success": true,
   *   "pdfs": [
   *     {
   *       "id": "uuid",
   *       "filename": "application-...",
   *       "planType": "SHINBOK_PRE_WORKOUT",
   *       "createdAt": "2024-01-15T12:00:00Z",
   *       "downloadUrl": "/api/v1/pdf/download/{filename}"
   *     }
   *   ]
   * }
   */
  fastify.get('/pdf/history', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      
      const pdfs = await fastify.prisma.generatedPDF.findMany({
        where: {
          userId: userId
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          filename: true,
          planType: true,
          status: true,
          createdAt: true,
          analysisId: true
        }
      });
      
      const pdfList = pdfs.map(pdf => ({
        id: pdf.id,
        filename: pdf.filename,
        planType: pdf.planType,
        status: pdf.status,
        createdAt: pdf.createdAt,
        downloadUrl: `/api/v1/pdf/download/${pdf.filename}`,
        analysisId: pdf.analysisId
      }));
      
      return reply.status(200).send({
        success: true,
        pdfs: pdfList,
        total: pdfs.length
      });
      
    } catch (error) {
      fastify.log.error('PDF history error:', error);
      return reply.status(500).send({
        success: false,
        error: 'HISTORY_FETCH_FAILED',
        message: 'Failed to fetch PDF history'
      });
    }
  });
}

module.exports = pdfGenerationRoutes;
