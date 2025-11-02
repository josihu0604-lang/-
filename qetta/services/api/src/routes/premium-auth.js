/**
 * Premium Tier Authentication Routes
 * 
 * POST /auth/signup - Premium signup with phone verification and plan selection
 * POST /auth/phone/send - Send phone verification code
 * POST /auth/phone/verify - Verify phone code
 * POST /auth/login - Premium user login
 */

const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { sign } = require('../util');

/**
 * In-memory store for verification codes (replace with Redis in production)
 */
const verificationCodes = new Map();

/**
 * Generate 6-digit verification code
 */
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send SMS via NICE API (mock implementation)
 * In production, this would integrate with NICE API
 */
async function sendSMS(phone, code) {
  // TODO: Replace with actual NICE API integration
  console.log(`[SMS] Sending verification code to ${phone}: ${code}`);
  
  // For development: log code to console
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📱 Verification code for ${phone}: ${code}`);
  }
  
  return true;
}

/**
 * Verify phone with NICE API (mock implementation)
 */
async function verifyPhoneWithNICE(phone, code) {
  // TODO: Replace with actual NICE API verification
  const storedCode = verificationCodes.get(phone);
  
  if (!storedCode) {
    throw new Error('인증번호가 만료되었거나 존재하지 않습니다');
  }
  
  if (storedCode.code !== code) {
    throw new Error('인증번호가 올바르지 않습니다');
  }
  
  if (Date.now() > storedCode.expiresAt) {
    verificationCodes.delete(phone);
    throw new Error('인증번호가 만료되었습니다');
  }
  
  return true;
}

/**
 * Register routes
 */
async function premiumAuthRoutes(fastify, options) {
  
  /**
   * POST /auth/phone/send
   * 
   * Send phone verification code
   */
  fastify.post('/phone/send', {
    schema: {
      body: {
        type: 'object',
        required: ['phone'],
        properties: {
          phone: { type: 'string', pattern: '^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { phone } = request.body;
      
      // Normalize phone number (remove hyphens)
      const normalizedPhone = phone.replace(/-/g, '');
      
      // Generate code
      const code = generateVerificationCode();
      
      // Store code with 5-minute expiry
      verificationCodes.set(normalizedPhone, {
        code,
        expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
      });
      
      // Send SMS
      await sendSMS(normalizedPhone, code);
      
      return {
        success: true,
        message: '인증번호가 전송되었습니다',
        expiresIn: 300 // seconds
      };
      
    } catch (error) {
      fastify.log.error('Phone verification send error:', error);
      
      return reply.code(500).send({
        error: 'SEND_FAILED',
        message: '인증번호 전송에 실패했습니다'
      });
    }
  });
  
  /**
   * POST /auth/phone/verify
   * 
   * Verify phone code
   */
  fastify.post('/phone/verify', {
    schema: {
      body: {
        type: 'object',
        required: ['phone', 'code'],
        properties: {
          phone: { type: 'string' },
          code: { type: 'string', pattern: '^[0-9]{6}$' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { phone, code } = request.body;
      
      // Normalize phone number
      const normalizedPhone = phone.replace(/-/g, '');
      
      // Verify code
      await verifyPhoneWithNICE(normalizedPhone, code);
      
      // Mark as verified (store in session or temporary token)
      verificationCodes.delete(normalizedPhone);
      
      return {
        success: true,
        verified: true,
        message: '본인인증이 완료되었습니다'
      };
      
    } catch (error) {
      fastify.log.error('Phone verification error:', error);
      
      return reply.code(400).send({
        error: 'VERIFICATION_FAILED',
        message: error.message || '인증에 실패했습니다'
      });
    }
  });
  
  /**
   * POST /auth/signup
   * 
   * Premium tier signup with phone verification and plan
   */
  fastify.post('/signup', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password', 'name', 'phone', 'plan'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          name: { type: 'string', minLength: 2 },
          phone: { type: 'string' },
          plan: { type: 'string', enum: ['basic', 'standard', 'premium'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { email, password, name, phone, plan } = request.body;
      
      // Check if user already exists
      const existingUser = await fastify.prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return reply.code(409).send({
          error: 'USER_EXISTS',
          message: '이미 가입된 이메일입니다'
        });
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);
      
      // Create user (Premium tier will be set after payment)
      const user = await fastify.prisma.user.create({
        data: {
          email,
          password: passwordHash
        }
      });
      
      // Store user metadata (name, phone, selected plan)
      // In production, this would be in a separate UserProfile table
      // For now, we'll pass it to the payment flow
      
      // Generate JWT token
      const accessToken = sign(user.id);
      
      return {
        userId: user.id,
        accessToken,
        user: {
          id: user.id,
          email: user.email
        },
        selectedPlan: plan,
        message: '회원가입이 완료되었습니다. 결제를 진행해주세요.'
      };
      
    } catch (error) {
      fastify.log.error('Signup error:', error);
      
      return reply.code(500).send({
        error: 'SIGNUP_FAILED',
        message: '회원가입 중 오류가 발생했습니다'
      });
    }
  });
  
  /**
   * POST /auth/login (Premium version with tier check)
   */
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { email, password } = request.body;
      
      // Find user
      const user = await fastify.prisma.user.findUnique({
        where: { email },
        include: {
          subscription: true
        }
      });
      
      if (!user) {
        return reply.code(401).send({
          error: 'INVALID_CREDENTIALS',
          message: '이메일 또는 비밀번호가 올바르지 않습니다'
        });
      }
      
      // Verify password
      const passwordValid = await bcrypt.compare(password, user.password);
      
      if (!passwordValid) {
        return reply.code(401).send({
          error: 'INVALID_CREDENTIALS',
          message: '이메일 또는 비밀번호가 올바르지 않습니다'
        });
      }
      
      // Generate JWT token
      const accessToken = sign(user.id);
      
      return {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          tier: user.subscription?.tier || 'FREE',
          subscriptionStatus: user.subscription?.status || null
        }
      };
      
    } catch (error) {
      fastify.log.error('Login error:', error);
      
      return reply.code(500).send({
        error: 'LOGIN_FAILED',
        message: '로그인 중 오류가 발생했습니다'
      });
    }
  });
  
  /**
   * GET /auth/me (Get current user info)
   */
  fastify.get('/me', {
    onRequest: [fastify.authenticate] // Requires auth middleware
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
          subscription: {
            select: {
              tier: true,
              status: true,
              currentPeriodEnd: true
            }
          }
        }
      });
      
      if (!user) {
        return reply.code(404).send({
          error: 'USER_NOT_FOUND'
        });
      }
      
      return {
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
          tier: user.subscription?.tier || 'FREE',
          subscriptionStatus: user.subscription?.status || null,
          subscriptionEnd: user.subscription?.currentPeriodEnd || null
        }
      };
      
    } catch (error) {
      fastify.log.error('Get user error:', error);
      
      return reply.code(500).send({
        error: 'FETCH_FAILED'
      });
    }
  });
}

module.exports = premiumAuthRoutes;
