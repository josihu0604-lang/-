/**
 * Background Worker: Account Synchronization
 * 
 * Syncs bank accounts and transactions from OAuth providers
 * Runs periodically via cron or on-demand via queue
 */

const { Worker, Queue } = require('bullmq');
const { prisma } = require('../prisma');
const kftc = require('../lib/kftc');
const Redis = require('ioredis');

// Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null
});

// Queue for account sync jobs
const accountSyncQueue = new Queue('account-sync', { connection });

/**
 * Add account sync job to queue
 */
async function enqueueAccountSync(userId, options = {}) {
  const job = await accountSyncQueue.add(
    'sync-accounts',
    { userId, ...options },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: {
        age: 3600, // Keep for 1 hour
        count: 100
      },
      removeOnFail: {
        age: 86400 // Keep failures for 24 hours
      }
    }
  );
  
  return job.id;
}

/**
 * Worker to process account sync jobs
 */
const worker = new Worker(
  'account-sync',
  async (job) => {
    const { userId } = job.data;
    
    job.log(`Starting account sync for user ${userId}`);
    await job.updateProgress(0);
    
    try {
      // Get user's OAuth connections
      const auths = await prisma.externalAuth.findMany({
        where: { userId }
      });
      
      if (auths.length === 0) {
        throw new Error('No OAuth providers connected');
      }
      
      const results = {
        accounts: [],
        transactions: [],
        errors: []
      };
      
      // Process each provider
      for (let i = 0; i < auths.length; i++) {
        const auth = auths[i];
        const progress = ((i + 1) / auths.length) * 100;
        
        try {
          job.log(`Syncing ${auth.provider} for user ${userId}`);
          
          if (auth.provider === 'KFTC_OPENBANKING') {
            const syncResult = await syncKftcProvider(userId, auth, job);
            results.accounts.push(...syncResult.accounts);
            results.transactions.push(...syncResult.transactions);
          }
          // Add more providers here (Toss, etc.)
          
          await job.updateProgress(progress);
        } catch (error) {
          job.log(`Error syncing ${auth.provider}: ${error.message}`);
          results.errors.push({
            provider: auth.provider,
            error: error.message
          });
        }
      }
      
      await job.updateProgress(100);
      
      job.log(`Sync complete: ${results.accounts.length} accounts, ${results.transactions.length} transactions`);
      
      return results;
    } catch (error) {
      job.log(`Sync failed: ${error.message}`);
      throw error;
    }
  },
  {
    connection,
    concurrency: 5, // Process up to 5 jobs concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 1000 // per second
    }
  }
);

/**
 * Sync KFTC OpenBanking provider
 */
async function syncKftcProvider(userId, auth, job) {
  const accounts = [];
  const transactions = [];
  
  // Get account list
  job.log('Fetching KFTC account list');
  const accountList = await kftc.getAccountList(
    auth.accessToken,
    auth.metadata.user_seq_no
  );
  
  if (!accountList.res_list || accountList.res_list.length === 0) {
    return { accounts, transactions };
  }
  
  // Sync each account
  for (const kftcAccount of accountList.res_list) {
    try {
      job.log(`Syncing account ${kftcAccount.fintech_use_num}`);
      
      // Get balance
      const bankTranId = `QETTA${Date.now().toString().slice(-14)}`;
      const balanceData = await kftc.getAccountBalance(
        auth.accessToken,
        kftcAccount.fintech_use_num,
        bankTranId
      );
      
      // Determine account type
      const accountType = determineAccountType(
        kftcAccount.account_type,
        balanceData.balance_amt
      );
      
      // Mask account number
      const maskedNumber = maskAccountNumber(
        kftcAccount.account_num_masked || kftcAccount.account_num
      );
      
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
      
      // Sync transactions
      const txResult = await syncAccountTransactions(
        account.id,
        auth,
        kftcAccount.fintech_use_num,
        job
      );
      transactions.push(...txResult);
      
    } catch (error) {
      job.log(`Failed to sync account ${kftcAccount.fintech_use_num}: ${error.message}`);
    }
  }
  
  return { accounts, transactions };
}

/**
 * Sync transactions for an account
 */
async function syncAccountTransactions(accountId, auth, fintechUseNum, job) {
  const transactions = [];
  
  // Sync last 90 days
  const today = new Date();
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(today.getDate() - 90);
  
  const fromDate = formatDate(ninetyDaysAgo);
  const toDate = formatDate(today);
  const bankTranId = `QETTA${Date.now().toString().slice(-14)}`;
  
  try {
    job.log(`Fetching transactions for account ${accountId} from ${fromDate} to ${toDate}`);
    
    const txData = await kftc.getTransactionList(
      auth.accessToken,
      fintechUseNum,
      bankTranId,
      fromDate,
      toDate
    );
    
    if (!txData.res_list || txData.res_list.length === 0) {
      return transactions;
    }
    
    job.log(`Found ${txData.res_list.length} transactions`);
    
    // Insert transactions (skip duplicates)
    for (const tx of txData.res_list) {
      try {
        const transaction = await prisma.transaction.upsert({
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
        
        transactions.push(transaction);
      } catch (txError) {
        // Skip duplicate transactions silently
        if (!txError.message.includes('Unique constraint')) {
          job.log(`Failed to insert transaction ${tx.tran_no}: ${txError.message}`);
        }
      }
    }
  } catch (error) {
    job.log(`Failed to fetch transactions: ${error.message}`);
  }
  
  return transactions;
}

/**
 * Utility functions
 */
function determineAccountType(accountType, balance) {
  if (accountType === '1') return 'SAVINGS';
  if (accountType === '2') return 'CHECKING';
  if (balance < 0) return 'LOAN';
  return 'SAVINGS';
}

function maskAccountNumber(accountNum) {
  if (!accountNum) return 'XXXX-XX-XXXXXX';
  const parts = accountNum.split('-');
  if (parts.length >= 3) {
    return `${parts[0]}-**-******`;
  }
  return accountNum.substring(0, 6) + '-**-******';
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function categorizeTransaction(tranType, description) {
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

// Worker event handlers
worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed:`, job.returnvalue);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...');
  await worker.close();
  await connection.quit();
  process.exit(0);
});

module.exports = {
  accountSyncQueue,
  enqueueAccountSync,
  worker
};
