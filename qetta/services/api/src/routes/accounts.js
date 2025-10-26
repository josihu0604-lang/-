/**
 * Bank Accounts API Routes
 * 
 * Handles syncing and managing bank accounts from OAuth providers
 */

const { prisma } = require('../prisma');
const { z } = require('zod');
const kftc = require('../lib/kftc');

module.exports = async function(app) {
  
  /**
   * POST /accounts/sync
   * Sync bank accounts from connected OAuth providers
   */
  app.post('/accounts/sync', {
    preHandler: app.authenticate
  }, async (req, reply) => {
    try {
      const userId = req.user.id;
      
      // Get user's connected OAuth providers
      const auths = await prisma.externalAuth.findMany({
        where: { userId }
      });
      
      if (auths.length === 0) {
        return reply.code(400).send({
          error: 'NO_OAUTH_CONNECTED',
          message: 'No OAuth providers connected. Please connect Toss or KFTC first.'
        });
      }
      
      const syncResults = {
        accounts: [],
        errors: []
      };
      
      // Sync from each connected provider
      for (const auth of auths) {
        try {
          if (auth.provider === 'KFTC_OPENBANKING') {
            const kftcAccounts = await syncKftcAccounts(userId, auth, prisma);
            syncResults.accounts.push(...kftcAccounts);
          } else if (auth.provider === 'TOSS_CERT') {
            // Toss doesn't provide account list API yet
            // Just mark as synced
            req.log.info({ provider: 'TOSS_CERT' }, 'Toss sync not yet implemented');
          }
        } catch (error) {
          req.log.error({ error, provider: auth.provider }, 'Provider sync failed');
          syncResults.errors.push({
            provider: auth.provider,
            error: error.message
          });
        }
      }
      
      return {
        success: true,
        synced: syncResults.accounts.length,
        accounts: syncResults.accounts,
        errors: syncResults.errors
      };
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({
        error: 'SYNC_FAILED',
        message: error.message
      });
    }
  });
  
  /**
   * GET /accounts
   * Get all bank accounts for authenticated user
   */
  app.get('/accounts', {
    preHandler: app.authenticate
  }, async (req, reply) => {
    try {
      const schema = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
        type: z.enum(['CHECKING', 'SAVINGS', 'LOAN', 'CREDIT_CARD', 'INSTALLMENT_SAVINGS', 'DEPOSIT']).optional()
      });
      
      const parsed = schema.safeParse(req.query);
      if (!parsed.success) {
        return reply.code(400).send({
          error: 'BAD_REQUEST',
          details: parsed.error.flatten()
        });
      }
      
      const { page, limit, type } = parsed.data;
      const skip = (page - 1) * limit;
      
      const where = {
        userId: req.user.id,
        ...(type && { accountType: type })
      };
      
      const [accounts, total] = await Promise.all([
        prisma.bankAccount.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { transactions: true }
            }
          }
        }),
        prisma.bankAccount.count({ where })
      ]);
      
      return {
        accounts: accounts.map(maskAccountNumber),
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
   * GET /accounts/:id
   * Get single bank account details
   */
  app.get('/accounts/:id', {
    preHandler: app.authenticate
  }, async (req, reply) => {
    try {
      const { id } = req.params;
      
      const account = await prisma.bankAccount.findFirst({
        where: {
          id,
          userId: req.user.id
        },
        include: {
          transactions: {
            take: 10,
            orderBy: { transactionDate: 'desc' }
          }
        }
      });
      
      if (!account) {
        return reply.code(404).send({
          error: 'ACCOUNT_NOT_FOUND',
          message: 'Account not found or does not belong to you'
        });
      }
      
      return maskAccountNumber(account);
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({
        error: 'FETCH_FAILED',
        message: error.message
      });
    }
  });
  
  /**
   * GET /accounts/:id/transactions
   * Get transactions for a specific account
   */
  app.get('/accounts/:id/transactions', {
    preHandler: app.authenticate
  }, async (req, reply) => {
    try {
      const schema = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(50),
        category: z.enum(['INCOME', 'EXPENSE', 'TRANSFER', 'LOAN_REPAYMENT', 'LOAN_DISBURSEMENT', 'INTEREST_EARNED', 'INTEREST_PAID', 'FEE', 'OTHER']).optional(),
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional()
      });
      
      const parsed = schema.safeParse(req.query);
      if (!parsed.success) {
        return reply.code(400).send({
          error: 'BAD_REQUEST',
          details: parsed.error.flatten()
        });
      }
      
      const { page, limit, category, from, to } = parsed.data;
      const skip = (page - 1) * limit;
      const { id } = req.params;
      
      // Verify account belongs to user
      const account = await prisma.bankAccount.findFirst({
        where: { id, userId: req.user.id }
      });
      
      if (!account) {
        return reply.code(404).send({
          error: 'ACCOUNT_NOT_FOUND',
          message: 'Account not found'
        });
      }
      
      const where = {
        accountId: id,
        ...(category && { category }),
        ...(from && to && {
          transactionDate: {
            gte: new Date(from),
            lte: new Date(to)
          }
        })
      };
      
      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          skip,
          take: limit,
          orderBy: { transactionDate: 'desc' }
        }),
        prisma.transaction.count({ where })
      ]);
      
      return {
        transactions,
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
   * DELETE /accounts/:id
   * Delete a bank account
   */
  app.delete('/accounts/:id', {
    preHandler: app.authenticate
  }, async (req, reply) => {
    try {
      const { id } = req.params;
      
      const deleted = await prisma.bankAccount.deleteMany({
        where: {
          id,
          userId: req.user.id
        }
      });
      
      if (deleted.count === 0) {
        return reply.code(404).send({
          error: 'ACCOUNT_NOT_FOUND',
          message: 'Account not found'
        });
      }
      
      return { success: true, deleted: deleted.count };
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({
        error: 'DELETE_FAILED',
        message: error.message
      });
    }
  });
};

/**
 * Sync KFTC OpenBanking accounts
 */
async function syncKftcAccounts(userId, auth, prisma) {
  const accounts = [];
  
  // Get account list from KFTC
  const accountList = await kftc.getAccountList(auth.accessToken, auth.metadata.user_seq_no);
  
  if (!accountList.res_list || accountList.res_list.length === 0) {
    return accounts;
  }
  
  // Sync each account
  for (const kftcAccount of accountList.res_list) {
    try {
      // Get balance
      const bankTranId = `QETTA${Date.now().toString().slice(-14)}`;
      const balanceData = await kftc.getAccountBalance(
        auth.accessToken,
        kftcAccount.fintech_use_num,
        bankTranId
      );
      
      // Determine account type
      const accountType = determineAccountType(kftcAccount.account_type, balanceData.balance_amt);
      
      // Mask account number
      const maskedNumber = maskAccountNumberString(kftcAccount.account_num_masked || kftcAccount.account_num);
      
      // Upsert account
      const account = await prisma.bankAccount.upsert({
        where: {
          userId_provider_fintechUseNum: {
            userId,
            provider: 'KFTC_OPENBANKING',
            fintechUseNum: kftcAccount.fintech_use_num
          }
        },
        create: {
          userId,
          provider: 'KFTC_OPENBANKING',
          fintechUseNum: kftcAccount.fintech_use_num,
          bankCode: kftcAccount.bank_code_std,
          bankName: kftcAccount.bank_name,
          accountNumber: maskedNumber,
          accountType,
          accountName: kftcAccount.account_alias || null,
          balance: parseFloat(balanceData.balance_amt),
          currency: 'KRW',
          status: 'ACTIVE',
          lastSyncedAt: new Date(),
          metadata: {
            product_name: kftcAccount.product_name,
            account_holder_name: kftcAccount.account_holder_name,
            account_issue_date: kftcAccount.account_issue_date,
            available_amt: balanceData.available_amt
          }
        },
        update: {
          balance: parseFloat(balanceData.balance_amt),
          lastSyncedAt: new Date(),
          metadata: {
            product_name: kftcAccount.product_name,
            account_holder_name: kftcAccount.account_holder_name,
            account_issue_date: kftcAccount.account_issue_date,
            available_amt: balanceData.available_amt
          }
        }
      });
      
      accounts.push(account);
      
      // Sync recent transactions (last 30 days)
      await syncTransactions(account.id, auth, kftcAccount.fintech_use_num, prisma);
      
    } catch (error) {
      console.error(`Failed to sync account ${kftcAccount.fintech_use_num}:`, error);
    }
  }
  
  return accounts;
}

/**
 * Sync transactions for an account
 */
async function syncTransactions(accountId, auth, fintechUseNum, prisma) {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  const fromDate = formatDate(thirtyDaysAgo);
  const toDate = formatDate(today);
  const bankTranId = `QETTA${Date.now().toString().slice(-14)}`;
  
  try {
    const txData = await kftc.getTransactionList(
      auth.accessToken,
      fintechUseNum,
      bankTranId,
      fromDate,
      toDate
    );
    
    if (!txData.res_list || txData.res_list.length === 0) {
      return;
    }
    
    // Insert transactions (skip duplicates)
    for (const tx of txData.res_list) {
      try {
        await prisma.transaction.upsert({
          where: {
            accountId_providerTxId: {
              accountId,
              providerTxId: tx.tran_no
            }
          },
          create: {
            accountId,
            transactionDate: new Date(tx.tran_date + 'T' + tx.tran_time),
            amount: parseFloat(tx.tran_type === '1' ? tx.tran_amt : `-${tx.tran_amt}`),
            balanceAfter: parseFloat(tx.after_balance_amt),
            description: tx.print_content,
            category: categorizeTransaction(tx.tran_type, tx.print_content),
            merchantName: tx.print_content,
            providerTxId: tx.tran_no,
            metadata: {
              tran_type: tx.tran_type,
              inout_type: tx.inout_type
            }
          },
          update: {
            balanceAfter: parseFloat(tx.after_balance_amt)
          }
        });
      } catch (txError) {
        // Skip duplicate transactions
        console.error(`Failed to insert transaction ${tx.tran_no}:`, txError.message);
      }
    }
  } catch (error) {
    console.error(`Failed to sync transactions for ${fintechUseNum}:`, error);
  }
}

/**
 * Utility functions
 */
function determineAccountType(accountType, balance) {
  // Map KFTC account types
  if (accountType === '1') return 'SAVINGS';
  if (accountType === '2') return 'CHECKING';
  if (balance < 0) return 'LOAN';
  return 'SAVINGS';
}

function maskAccountNumberString(accountNum) {
  if (!accountNum) return 'XXXX-XX-XXXXXX';
  const parts = accountNum.split('-');
  if (parts.length >= 3) {
    return `${parts[0]}-**-******`;
  }
  return accountNum.substring(0, 6) + '-**-******';
}

function maskAccountNumber(account) {
  return {
    ...account,
    accountNumber: account.accountNumber // Already masked in DB
  };
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function categorizeTransaction(tranType, description) {
  // tranType: '1' = deposit, '2' = withdrawal
  const desc = description.toLowerCase();
  
  if (tranType === '1') {
    if (desc.includes('급여') || desc.includes('월급')) return 'INCOME';
    if (desc.includes('이자')) return 'INTEREST_EARNED';
    return 'INCOME';
  } else {
    if (desc.includes('대출') || desc.includes('상환')) return 'LOAN_REPAYMENT';
    if (desc.includes('이자')) return 'INTEREST_PAID';
    if (desc.includes('수수료')) return 'FEE';
    if (desc.includes('이체')) return 'TRANSFER';
    return 'EXPENSE';
  }
}

  /**
   * POST /accounts/sync/background
   * Trigger background account synchronization job
   * Returns job ID for tracking
   */
  app.post('/accounts/sync/background', {
    preHandler: app.authenticate
  }, async (req, reply) => {
    try {
      const userId = req.user.id;
      const { enqueueAccountSync } = require('../workers/sync-accounts');
      
      // Check if user has connected OAuth providers
      const authCount = await prisma.externalAuth.count({
        where: { userId }
      });
      
      if (authCount === 0) {
        return reply.code(400).send({
          error: 'NO_OAUTH_CONNECTED',
          message: 'No OAuth providers connected. Please connect Toss or KFTC first.'
        });
      }
      
      // Enqueue background sync job
      const jobId = await enqueueAccountSync(userId, {
        triggeredBy: 'manual',
        timestamp: new Date().toISOString()
      });
      
      return {
        success: true,
        jobId,
        message: 'Account sync job queued successfully',
        statusUrl: `/api/v1/accounts/sync/status/${jobId}`
      };
      
    } catch (error) {
      req.log.error({ error }, 'Failed to enqueue account sync');
      return reply.code(500).send({
        error: 'SYNC_QUEUE_ERROR',
        message: 'Failed to queue background sync job'
      });
    }
  });

  /**
   * GET /accounts/sync/status/:jobId
   * Check status of background sync job
   */
  app.get('/accounts/sync/status/:jobId', {
    preHandler: app.authenticate
  }, async (req, reply) => {
    try {
      const { jobId } = req.params;
      const { accountSyncQueue } = require('../workers/sync-accounts');
      
      const job = await accountSyncQueue.getJob(jobId);
      
      if (!job) {
        return reply.code(404).send({
          error: 'JOB_NOT_FOUND',
          message: 'Sync job not found'
        });
      }
      
      // Verify job belongs to current user
      if (job.data.userId !== req.user.id) {
        return reply.code(403).send({
          error: 'FORBIDDEN',
          message: 'Cannot access this job'
        });
      }
      
      const state = await job.getState();
      const progress = job.progress || 0;
      const logs = job.logs || [];
      
      return {
        jobId: job.id,
        status: state,
        progress,
        createdAt: new Date(job.timestamp).toISOString(),
        processedAt: job.processedOn ? new Date(job.processedOn).toISOString() : null,
        finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
        result: job.returnvalue || null,
        logs: logs.slice(-10), // Last 10 log entries
        error: job.failedReason || null
      };
      
    } catch (error) {
      req.log.error({ error }, 'Failed to get job status');
      return reply.code(500).send({
        error: 'STATUS_CHECK_ERROR',
        message: 'Failed to check job status'
      });
    }
  });
}
