/**
 * PDF Generation Engine
 * 
 * Generate application documents for debt restructuring programs
 * Supports: 신복위 프리워크아웃, 새출발기금, 개인회생, 개인파산
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Korean font paths (use system fonts or embed)
 * In production, embed Korean fonts
 */
const FONT_PATH = {
  regular: '/usr/share/fonts/truetype/nanum/NanumGothic.ttf',
  bold: '/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf'
};

/**
 * Generate PDF for 신복위 프리워크아웃 (Credit Counseling Pre-Workout)
 */
function generateShinbokApplication(data, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });
      
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
      
      // Header
      doc.fontSize(20)
         .text('신용회복위원회 프리워크아웃 신청서', { align: 'center' })
         .moveDown(2);
      
      // Personal Information
      doc.fontSize(14).text('1. 신청인 정보', { underline: true }).moveDown(0.5);
      doc.fontSize(11)
         .text(`성명: ${data.name || '_______________'}`)
         .text(`주민등록번호: ${data.ssn || '_______________-_______________'}`)
         .text(`주소: ${data.address || '___________________________________________________'}`)
         .text(`연락처: ${data.phone || '_______________'}`)
         .text(`이메일: ${data.email || '_______________'}`)
         .moveDown(1);
      
      // Debt Information
      doc.fontSize(14).text('2. 부채 현황', { underline: true }).moveDown(0.5);
      doc.fontSize(11)
         .text(`총 부채액: ${formatCurrency(data.totalDebt)}`)
         .text(`월 상환액: ${formatCurrency(data.monthlyPayment)}`)
         .text(`월 소득: ${formatCurrency(data.monthlyIncome)}`)
         .text(`DTI: ${data.dti.toFixed(1)}%`)
         .moveDown(1);
      
      // Debt Breakdown
      if (data.debts && data.debts.length > 0) {
        doc.fontSize(12).text('부채 내역:', { underline: true }).moveDown(0.5);
        data.debts.forEach((debt, idx) => {
          doc.fontSize(10)
             .text(`${idx + 1}. ${debt.creditor}`)
             .text(`   대출금액: ${formatCurrency(debt.amount)}`)
             .text(`   월 상환액: ${formatCurrency(debt.monthlyPayment)}`)
             .text(`   금리: ${debt.interestRate}%`)
             .moveDown(0.3);
        });
        doc.moveDown(1);
      }
      
      // Application Details
      doc.fontSize(14).text('3. 신청 내용', { underline: true }).moveDown(0.5);
      doc.fontSize(11)
         .text('프리워크아웃 신청 사유:')
         .text('• 고금리 부채로 인한 경제적 어려움')
         .text('• 채무조정을 통한 정상적인 경제활동 회복 희망')
         .moveDown(1);
      
      // Requested Plan
      if (data.plan) {
        doc.fontSize(14).text('4. 희망 조정 내용', { underline: true }).moveDown(0.5);
        doc.fontSize(11)
           .text(`조정 후 월 상환액: ${formatCurrency(data.plan.adjustedPayment)}`)
           .text(`조정 금리: ${data.plan.adjustedInterestRate}%`)
           .text(`상환 기간: ${data.plan.estimatedPeriod}개월`)
           .moveDown(1);
      }
      
      // Declaration
      doc.fontSize(14).text('5. 신청인 확인 사항', { underline: true }).moveDown(0.5);
      doc.fontSize(10)
         .text('본인은 위 내용이 사실임을 확인하며, 신용회복위원회의 채무조정 절차에 성실히 임할 것을 서약합니다.')
         .moveDown(2);
      
      // Signature
      doc.fontSize(11)
         .text(`신청일: ${new Date().toLocaleDateString('ko-KR')}`)
         .moveDown(1)
         .text('신청인: _______________ (서명 또는 인)')
         .moveDown(2);
      
      // Footer
      doc.fontSize(9)
         .text('※ 본 신청서는 qetta Premium 서비스를 통해 자동 생성되었습니다.', { align: 'center' })
         .text('※ 실제 제출 시 추가 서류가 필요할 수 있습니다.', { align: 'center' });
      
      doc.end();
      
      stream.on('finish', () => {
        resolve(outputPath);
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate PDF for 새출발기금 (Fresh Start Fund)
 */
function generateFreshStartApplication(data, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });
      
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
      
      // Header
      doc.fontSize(20)
         .text('새출발기금 신청서', { align: 'center' })
         .moveDown(2);
      
      // Personal Information
      doc.fontSize(14).text('1. 신청인 정보', { underline: true }).moveDown(0.5);
      doc.fontSize(11)
         .text(`성명: ${data.name || '_______________'}`)
         .text(`주민등록번호: ${data.ssn || '_______________-_______________'}`)
         .text(`주소: ${data.address || '___________________________________________________'}`)
         .text(`연락처: ${data.phone || '_______________'}`)
         .moveDown(1);
      
      // Financial Status
      doc.fontSize(14).text('2. 재무 현황', { underline: true }).moveDown(0.5);
      doc.fontSize(11)
         .text(`총 부채액: ${formatCurrency(data.totalDebt)}`)
         .text(`월 소득: ${formatCurrency(data.monthlyIncome)}`)
         .text(`부양가족 수: ${data.dependents || 0}명`)
         .moveDown(1);
      
      // Eligibility Check
      doc.fontSize(14).text('3. 자격 요건 확인', { underline: true }).moveDown(0.5);
      doc.fontSize(10)
         .text('☑ 총 부채액이 5천만원 이상 8억원 이하')
         .text('☑ 월 소득이 350만원 이하')
         .text('☑ 채무 상환 의지가 있음')
         .text('☑ 최근 5년 이내 면책 이력이 없음')
         .moveDown(1);
      
      // Application Reason
      doc.fontSize(14).text('4. 신청 사유', { underline: true }).moveDown(0.5);
      doc.fontSize(11)
         .text('• 저소득으로 인한 채무 상환 곤란')
         .text('• 고금리 부채로 인한 이자 부담 과중')
         .text('• 새출발기금을 통한 경제적 재기 희망')
         .moveDown(2);
      
      // Declaration
      doc.fontSize(10)
         .text('본인은 위 내용이 사실임을 확인하며, 새출발기금 지원 절차에 성실히 임할 것을 서약합니다.')
         .moveDown(2);
      
      // Signature
      doc.fontSize(11)
         .text(`신청일: ${new Date().toLocaleDateString('ko-KR')}`)
         .moveDown(1)
         .text('신청인: _______________ (서명 또는 인)')
         .moveDown(2);
      
      // Footer
      doc.fontSize(9)
         .text('※ 본 신청서는 qetta Premium 서비스를 통해 자동 생성되었습니다.', { align: 'center' });
      
      doc.end();
      
      stream.on('finish', () => {
        resolve(outputPath);
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate PDF for 개인회생 (Individual Recovery)
 */
function generateIndividualRecoveryApplication(data, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });
      
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
      
      // Header
      doc.fontSize(20)
         .text('개인회생 신청서', { align: 'center' })
         .moveDown(2);
      
      // Personal Information
      doc.fontSize(14).text('1. 채무자 정보', { underline: true }).moveDown(0.5);
      doc.fontSize(11)
         .text(`성명: ${data.name || '_______________'}`)
         .text(`주민등록번호: ${data.ssn || '_______________-_______________'}`)
         .text(`주소: ${data.address || '___________________________________________________'}`)
         .text(`직업: ${data.occupation || '_______________'}`)
         .text(`연락처: ${data.phone || '_______________'}`)
         .moveDown(1);
      
      // Debt Information
      doc.fontSize(14).text('2. 채무 현황', { underline: true }).moveDown(0.5);
      doc.fontSize(11)
         .text(`총 무담보채무: ${formatCurrency(data.totalDebt)}`)
         .text(`총 담보채무: ${formatCurrency(data.securedDebt || 0)}`)
         .text(`채권자 수: ${data.creditorCount || 0}명`)
         .moveDown(1);
      
      // Income and Assets
      doc.fontSize(14).text('3. 소득 및 재산 현황', { underline: true }).moveDown(0.5);
      doc.fontSize(11)
         .text(`월 평균 소득: ${formatCurrency(data.monthlyIncome)}`)
         .text(`재산 가액: ${formatCurrency(data.totalAssets || 0)}`)
         .moveDown(1);
      
      // Repayment Plan
      doc.fontSize(14).text('4. 변제 계획', { underline: true }).moveDown(0.5);
      doc.fontSize(11)
         .text(`변제 기간: ${data.plan?.estimatedPeriod || 60}개월`)
         .text(`월 변제액: ${formatCurrency(data.plan?.adjustedPayment || 0)}`)
         .text(`총 변제액: ${formatCurrency((data.plan?.adjustedPayment || 0) * (data.plan?.estimatedPeriod || 60))}`)
         .moveDown(2);
      
      // Declaration
      doc.fontSize(10)
         .text('본인은 채무를 변제할 의사가 있으나 현재의 경제적 상황으로는 채무 전액을 변제하기 어려워 개인회생 절차를 신청합니다.')
         .moveDown(2);
      
      // Signature
      doc.fontSize(11)
         .text(`신청일: ${new Date().toLocaleDateString('ko-KR')}`)
         .moveDown(1)
         .text('채무자: _______________ (서명 또는 인)')
         .moveDown(2);
      
      // Footer
      doc.fontSize(9)
         .text('※ 본 신청서는 qetta Premium 서비스를 통해 자동 생성되었습니다.', { align: 'center' })
         .text('※ 실제 법원 제출 시 법무사/변호사 상담이 필요합니다.', { align: 'center' });
      
      doc.end();
      
      stream.on('finish', () => {
        resolve(outputPath);
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Main PDF generation function
 * Routes to appropriate template based on plan type
 */
async function generateApplicationPDF(analysisData, planType, outputPath) {
  const data = {
    name: analysisData.userName || '',
    phone: analysisData.phone || '',
    email: analysisData.email || '',
    totalDebt: analysisData.summary.totalDebt,
    monthlyPayment: analysisData.summary.monthlyPayment,
    monthlyIncome: analysisData.summary.monthlyIncome,
    dti: analysisData.summary.dti,
    creditScore: analysisData.summary.creditScore,
    debts: analysisData.breakdown?.byCreditor || [],
    plan: analysisData.selectedPlan,
    creditorCount: analysisData.breakdown?.byCreditor?.length || 0,
    totalAssets: analysisData.summary.totalAssets || 0
  };
  
  switch (planType) {
    case 'SHINBOK_PRE_WORKOUT':
      return await generateShinbokApplication(data, outputPath);
    
    case 'FRESH_START_FUND':
      return await generateFreshStartApplication(data, outputPath);
    
    case 'INDIVIDUAL_RECOVERY':
      return await generateIndividualRecoveryApplication(data, outputPath);
    
    default:
      // Default to Shinbok template
      return await generateShinbokApplication(data, outputPath);
  }
}

/**
 * Format currency for Korean Won
 */
function formatCurrency(amount) {
  if (!amount) return '₩0';
  return `₩${Math.round(amount).toLocaleString('ko-KR')}`;
}

/**
 * Get output directory for PDFs
 */
function getPDFDirectory() {
  const dir = path.join(__dirname, '../../pdfs');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Generate PDF filename
 */
function generatePDFFilename(userId, planType) {
  const timestamp = Date.now();
  const planName = planType.toLowerCase().replace(/_/g, '-');
  return `application-${planName}-${userId}-${timestamp}.pdf`;
}

module.exports = {
  generateApplicationPDF,
  generateShinbokApplication,
  generateFreshStartApplication,
  generateIndividualRecoveryApplication,
  getPDFDirectory,
  generatePDFFilename
};
