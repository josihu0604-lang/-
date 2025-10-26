/**
 * OCR Engine - Google Cloud Vision API
 * 
 * CreditForYou PDF → Text Extraction
 */

const vision = require('@google-cloud/vision');
const fs = require('fs');

// Initialize Google Vision client
let visionClient = null;

function getVisionClient() {
  if (visionClient) return visionClient;
  
  // Check for credentials
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    visionClient = new vision.ImageAnnotatorClient();
  } else {
    console.warn('⚠️  GOOGLE_APPLICATION_CREDENTIALS not set. OCR will use mock data.');
    visionClient = null;
  }
  
  return visionClient;
}

/**
 * Extract text from PDF using Google Vision API
 * 
 * @param {string} pdfPath - Path to PDF file
 * @returns {Promise<Object>} Extracted credit data
 */
async function extractCreditInfo(pdfPath) {
  const client = getVisionClient();
  
  // If no client, return mock data for development
  if (!client) {
    return extractMockData();
  }
  
  try {
    // Read PDF file
    const fileBuffer = fs.readFileSync(pdfPath);
    const base64File = fileBuffer.toString('base64');
    
    // Call Vision API
    const [result] = await client.documentTextDetection({
      image: { content: base64File }
    });
    
    const fullText = result.fullTextAnnotation?.text || '';
    
    // Parse CreditForYou format
    return parseCreditForYouText(fullText);
    
  } catch (error) {
    console.error('OCR extraction failed:', error);
    throw new Error('PDF 읽기에 실패했습니다');
  }
}

/**
 * Parse CreditForYou PDF text
 */
function parseCreditForYouText(text) {
  const data = {
    creditScore: null,
    creditGrade: null,
    loans: [],
    creditCards: [],
    totalDebt: 0,
    monthlyPayment: 0,
    extractedAt: new Date().toISOString()
  };
  
  // Extract credit score (700~1000)
  const scoreMatch = text.match(/신용점수[:\s]*(\d{3,4})/);
  if (scoreMatch) {
    data.creditScore = parseInt(scoreMatch[1]);
  }
  
  // Extract credit grade (AAA, AA, A, BBB, BB, B, CCC, CC, C, D)
  const gradeMatch = text.match(/신용등급[:\s]*([A-D]+)/i);
  if (gradeMatch) {
    data.creditGrade = gradeMatch[1].toUpperCase();
  }
  
  // Extract loans (pattern: 은행명, 대출금액, 월상환액)
  const loanPattern = /대출.*?(\d{1,3}(?:,\d{3})*)\s*원.*?월\s*(\d{1,3}(?:,\d{3})*)\s*원/g;
  let loanMatch;
  while ((loanMatch = loanPattern.exec(text)) !== null) {
    const amount = parseInt(loanMatch[1].replace(/,/g, ''));
    const monthlyPayment = parseInt(loanMatch[2].replace(/,/g, ''));
    
    data.loans.push({
      type: 'LOAN',
      amount,
      monthlyPayment,
      balance: amount // Assume full balance for simplicity
    });
    
    data.totalDebt += amount;
    data.monthlyPayment += monthlyPayment;
  }
  
  // Extract credit cards (pattern: 카드명, 사용금액)
  const cardPattern = /카드.*?(\d{1,3}(?:,\d{3})*)\s*원/g;
  let cardMatch;
  while ((cardMatch = cardPattern.exec(text)) !== null) {
    const amount = parseInt(cardMatch[1].replace(/,/g, ''));
    
    data.creditCards.push({
      type: 'CREDIT_CARD',
      amount,
      monthlyPayment: Math.round(amount * 0.05) // Assume 5% minimum payment
    });
    
    data.totalDebt += amount;
    data.monthlyPayment += Math.round(amount * 0.05);
  }
  
  return data;
}

/**
 * Mock data for development (no Google credentials)
 */
function extractMockData() {
  return {
    creditScore: 720,
    creditGrade: 'C',
    loans: [
      {
        type: 'LOAN',
        bankName: '국민은행',
        amount: 35000000,
        monthlyPayment: 800000,
        balance: 35000000,
        interestRate: 4.5
      },
      {
        type: 'LOAN',
        bankName: '신한은행',
        amount: 28000000,
        monthlyPayment: 650000,
        balance: 28000000,
        interestRate: 5.2
      },
      {
        type: 'LOAN',
        bankName: 'SBI저축은행',
        amount: 15000000,
        monthlyPayment: 400000,
        balance: 15000000,
        interestRate: 12.5
      }
    ],
    creditCards: [
      {
        type: 'CREDIT_CARD',
        cardName: '신한카드',
        amount: 4500000,
        monthlyPayment: 225000
      },
      {
        type: 'CREDIT_CARD',
        cardName: '삼성카드',
        amount: 3000000,
        monthlyPayment: 150000
      },
      {
        type: 'CREDIT_CARD',
        cardName: '현대카드',
        amount: 2000000,
        monthlyPayment: 100000
      }
    ],
    totalDebt: 87500000, // ₩87.5M
    monthlyPayment: 2325000, // ₩2.325M
    extractedAt: new Date().toISOString()
  };
}

/**
 * Validate extracted data
 */
function validateExtractedData(data) {
  const errors = [];
  
  if (!data.creditScore || data.creditScore < 300 || data.creditScore > 1000) {
    errors.push('신용점수를 찾을 수 없습니다 (300~1000)');
  }
  
  if (!data.creditGrade) {
    errors.push('신용등급을 찾을 수 없습니다');
  }
  
  if (data.totalDebt === 0) {
    errors.push('부채 정보를 찾을 수 없습니다');
  }
  
  if (data.monthlyPayment === 0) {
    errors.push('월 상환액 정보를 찾을 수 없습니다');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  extractCreditInfo,
  validateExtractedData,
  parseCreditForYouText,
  extractMockData
};
