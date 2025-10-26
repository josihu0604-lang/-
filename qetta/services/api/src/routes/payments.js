/**
 * Payment Routes - Toss Payments Integration
 * 
 * POST /payments/create-order - Create payment order
 * POST /payments/confirm - Confirm payment (Toss webhook)
 * POST /payments/cancel - Cancel/refund payment
 * GET /payments/:orderId - Get payment status
 */

const crypto = require('crypto');

/**
 * Generate unique order ID
 */
function generateOrderId() {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `ORD_${timestamp}_${random}`;
}

/**
 * Verify Toss Payments webhook signature
 */
function verifyTossSignature(payload, signature, secretKey) {
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(JSON.stringify(payload))
    .digest('base64');
  
  return hash === signature;
}

/**
 * Get subscription tier from plan ID
 */
function getPlanTier(planId) {
  const mapping = {
    basic: 'STARTER',
    standard: 'PRO',
    premium: 'ENTERPRISE'
  };
  return mapping[planId] || 'STARTER';
}

/**
 * Register routes
 */
async function paymentsRoutes(fastify, options) {
  
  /**
   * POST /payments/create-order
   * 
   * Create payment order for Toss Payments
   */
  fastify.post('/create-order', {
    schema: {
      body: {
        type: 'object',
        required: ['userId', 'plan', 'amount', 'method'],
        properties: {
          userId: { type: 'string' },
          plan: { type: 'string', enum: ['basic', 'standard', 'premium'] },
          amount: { type: 'number', minimum: 0 },
          method: { type: 'string', enum: ['CARD', 'TRANSFER'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { userId, plan, amount, method } = request.body;
      
      // Verify user exists
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        return reply.code(404).send({
          error: 'USER_NOT_FOUND',
          message: '사용자를 찾을 수 없습니다'
        });
      }
      
      // Generate order ID
      const orderId = generateOrderId();
      
      // Create order name
      const planNames = {
        basic: 'qetta Premium Basic',
        standard: 'qetta Premium Standard',
        premium: 'qetta Premium Premium'
      };
      const orderName = planNames[plan] || 'qetta Premium';
      
      // Store order in database (using metadata JSON for now)
      // In production, create a PaymentOrder model
      const order = {
        orderId,
        userId,
        plan,
        amount,
        method,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };
      
      // TODO: Store in database
      // For now, we'll rely on Toss callback to create subscription
      
      fastify.log.info('Payment order created:', { orderId, userId, plan, amount });
      
      return {
        orderId,
        orderName,
        amount,
        method
      };
      
    } catch (error) {
      fastify.log.error('Create order error:', error);
      
      return reply.code(500).send({
        error: 'ORDER_CREATION_FAILED',
        message: '주문 생성에 실패했습니다'
      });
    }
  });
  
  /**
   * POST /payments/confirm
   * 
   * Confirm payment and activate subscription (Toss webhook)
   */
  fastify.post('/confirm', {
    schema: {
      body: {
        type: 'object',
        required: ['paymentKey', 'orderId', 'amount'],
        properties: {
          paymentKey: { type: 'string' },
          orderId: { type: 'string' },
          amount: { type: 'number' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { paymentKey, orderId, amount } = request.body;
      
      // Verify signature if available
      const signature = request.headers['x-toss-signature'];
      if (signature && process.env.TOSS_SECRET_KEY) {
        const isValid = verifyTossSignature(
          request.body,
          signature,
          process.env.TOSS_SECRET_KEY
        );
        
        if (!isValid) {
          return reply.code(401).send({
            error: 'INVALID_SIGNATURE',
            message: '서명이 올바르지 않습니다'
          });
        }
      }
      
      // Extract userId and plan from orderId
      // Format: ORD_{timestamp}_{random}
      // We need to look up the order in database or decode from orderId
      
      // For now, confirm payment with Toss API
      const tossSecretKey = process.env.TOSS_SECRET_KEY || 'test_sk_TEST_SECRET_KEY';
      const encodedKey = Buffer.from(tossSecretKey + ':').toString('base64');
      
      const confirmResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${encodedKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount
        })
      });
      
      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json();
        throw new Error(errorData.message || '결제 승인에 실패했습니다');
      }
      
      const payment = await confirmResponse.json();
      
      // Extract user info from payment metadata or database lookup
      // For demo, we'll extract from order
      
      fastify.log.info('Payment confirmed:', { paymentKey, orderId, amount, payment });
      
      // TODO: Update user subscription
      // await fastify.prisma.subscription.create({
      //   data: {
      //     userId: extractedUserId,
      //     tier: getPlanTier(extractedPlan),
      //     status: 'ACTIVE',
      //     currentPeriodStart: new Date(),
      //     currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      //   }
      // });
      
      return {
        success: true,
        paymentKey,
        orderId,
        status: payment.status,
        approvedAt: payment.approvedAt
      };
      
    } catch (error) {
      fastify.log.error('Payment confirmation error:', error);
      
      return reply.code(500).send({
        error: 'CONFIRMATION_FAILED',
        message: error.message || '결제 승인 처리 중 오류가 발생했습니다'
      });
    }
  });
  
  /**
   * POST /payments/cancel
   * 
   * Cancel or refund payment
   */
  fastify.post('/cancel', {
    schema: {
      body: {
        type: 'object',
        required: ['paymentKey', 'cancelReason'],
        properties: {
          paymentKey: { type: 'string' },
          cancelReason: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { paymentKey, cancelReason } = request.body;
      
      const tossSecretKey = process.env.TOSS_SECRET_KEY || 'test_sk_TEST_SECRET_KEY';
      const encodedKey = Buffer.from(tossSecretKey + ':').toString('base64');
      
      const cancelResponse = await fetch(
        `https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${encodedKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            cancelReason
          })
        }
      );
      
      if (!cancelResponse.ok) {
        const errorData = await cancelResponse.json();
        throw new Error(errorData.message || '결제 취소에 실패했습니다');
      }
      
      const cancellation = await cancelResponse.json();
      
      fastify.log.info('Payment cancelled:', { paymentKey, cancelReason });
      
      // TODO: Update subscription status to CANCELLED
      
      return {
        success: true,
        paymentKey,
        status: cancellation.status,
        cancelledAt: cancellation.canceledAt
      };
      
    } catch (error) {
      fastify.log.error('Payment cancellation error:', error);
      
      return reply.code(500).send({
        error: 'CANCELLATION_FAILED',
        message: error.message || '결제 취소 처리 중 오류가 발생했습니다'
      });
    }
  });
  
  /**
   * GET /payments/:orderId
   * 
   * Get payment status
   */
  fastify.get('/:orderId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          orderId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { orderId } = request.params;
      
      // TODO: Look up order in database
      // For now, return mock status
      
      return {
        orderId,
        status: 'PENDING',
        message: '주문 조회 기능은 구현 예정입니다'
      };
      
    } catch (error) {
      fastify.log.error('Get payment status error:', error);
      
      return reply.code(500).send({
        error: 'STATUS_CHECK_FAILED',
        message: '주문 조회 중 오류가 발생했습니다'
      });
    }
  });
}

module.exports = paymentsRoutes;
