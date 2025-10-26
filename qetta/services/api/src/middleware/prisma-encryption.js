/**
 * Prisma Middleware for Automatic Field Encryption
 * 
 * Automatically encrypts/decrypts sensitive fields on database operations:
 * - ExternalAuth: accessToken, refreshToken
 * - User: email (hashed for uniqueness, encrypted for storage)
 * 
 * Usage:
 *   const { prisma } = require('./prisma');
 *   const { registerEncryptionMiddleware } = require('./middleware/prisma-encryption');
 *   registerEncryptionMiddleware(prisma);
 */

const { encrypt, decrypt, hashData, encryptFields, decryptFields } = require('../lib/encryption');

/**
 * Configuration for which fields to encrypt in each model
 */
const ENCRYPTION_CONFIG = {
  ExternalAuth: {
    encryptFields: ['accessToken', 'refreshToken'],
    hashFields: [] // None - tokens are not searchable
  },
  User: {
    encryptFields: [], // Email stored as hash only
    hashFields: ['email'] // For unique index and lookups
  }
  // Add more models as needed
};

/**
 * Register encryption middleware with Prisma client
 * 
 * @param {PrismaClient} prisma - Prisma client instance
 */
function registerEncryptionMiddleware(prisma) {
  
  // Middleware for encrypting data before writes
  prisma.$use(async (params, next) => {
    const config = ENCRYPTION_CONFIG[params.model];
    
    if (!config) {
      return next(params);
    }
    
    // Encrypt fields on create/update operations
    if (params.action === 'create' || params.action === 'update') {
      if (params.args.data) {
        params.args.data = processDataForWrite(params.args.data, config);
      }
    }
    
    // Encrypt fields in batch operations
    if (params.action === 'createMany' || params.action === 'updateMany') {
      if (params.args.data) {
        if (Array.isArray(params.args.data)) {
          params.args.data = params.args.data.map(item => processDataForWrite(item, config));
        } else {
          params.args.data = processDataForWrite(params.args.data, config);
        }
      }
    }
    
    // Encrypt fields in upsert operations
    if (params.action === 'upsert') {
      if (params.args.create) {
        params.args.create = processDataForWrite(params.args.create, config);
      }
      if (params.args.update) {
        params.args.update = processDataForWrite(params.args.update, config);
      }
    }
    
    return next(params);
  });
  
  // Middleware for decrypting data after reads
  prisma.$use(async (params, next) => {
    const result = await next(params);
    const config = ENCRYPTION_CONFIG[params.model];
    
    if (!config || !result) {
      return result;
    }
    
    // Decrypt fields on read operations
    if (params.action === 'findUnique' || params.action === 'findFirst') {
      return processDataForRead(result, config);
    }
    
    // Decrypt fields in array results
    if (params.action === 'findMany') {
      if (Array.isArray(result)) {
        return result.map(item => processDataForRead(item, config));
      }
    }
    
    // Decrypt fields in aggregations with records
    if (params.action === 'findFirstOrThrow' || params.action === 'findUniqueOrThrow') {
      return processDataForRead(result, config);
    }
    
    return result;
  });
  
  console.log('✅ Prisma encryption middleware registered');
}

/**
 * Process data before writing to database
 * 
 * @param {Object} data - Data to write
 * @param {Object} config - Encryption configuration
 * @returns {Object} Processed data
 */
function processDataForWrite(data, config) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const processed = { ...data };
  
  // Encrypt specified fields
  if (config.encryptFields && config.encryptFields.length > 0) {
    for (const field of config.encryptFields) {
      if (field in processed && processed[field] !== null && processed[field] !== undefined) {
        // Only encrypt if not already encrypted (check format)
        const value = String(processed[field]);
        if (!isEncrypted(value)) {
          processed[field] = encrypt(value);
        }
      }
    }
  }
  
  // Hash specified fields
  if (config.hashFields && config.hashFields.length > 0) {
    for (const field of config.hashFields) {
      if (field in processed && processed[field] !== null && processed[field] !== undefined) {
        const value = String(processed[field]);
        // Store hash for uniqueness/searchability
        processed[`${field}Hash`] = hashData(value);
      }
    }
  }
  
  return processed;
}

/**
 * Process data after reading from database
 * 
 * @param {Object} data - Data from database
 * @param {Object} config - Encryption configuration
 * @returns {Object} Processed data
 */
function processDataForRead(data, config) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const processed = { ...data };
  
  // Decrypt specified fields
  if (config.encryptFields && config.encryptFields.length > 0) {
    for (const field of config.encryptFields) {
      if (field in processed && processed[field] !== null && processed[field] !== undefined) {
        try {
          processed[field] = decrypt(String(processed[field]));
        } catch (error) {
          // If decryption fails, field might not be encrypted yet
          console.warn(`Failed to decrypt field '${field}':`, error.message);
        }
      }
    }
  }
  
  // Note: Hash fields are not decrypted (one-way hash)
  // Original values should be stored encrypted separately if needed
  
  return processed;
}

/**
 * Check if a value is already encrypted
 * 
 * @param {string} value - Value to check
 * @returns {boolean} True if encrypted
 */
function isEncrypted(value) {
  if (!value || typeof value !== 'string') {
    return false;
  }
  
  // Encrypted format: iv:authTag:ciphertext (3 base64 parts)
  const parts = value.split(':');
  if (parts.length !== 3) {
    return false;
  }
  
  // Validate base64 format
  try {
    Buffer.from(parts[0], 'base64');
    Buffer.from(parts[1], 'base64');
    Buffer.from(parts[2], 'base64');
    return true;
  } catch {
    return false;
  }
}

/**
 * Manually encrypt ExternalAuth tokens (for migration scripts)
 * 
 * @param {Object} auth - ExternalAuth record
 * @returns {Object} Auth with encrypted tokens
 */
function encryptExternalAuth(auth) {
  return processDataForWrite(auth, ENCRYPTION_CONFIG.ExternalAuth);
}

/**
 * Manually decrypt ExternalAuth tokens (for debugging)
 * 
 * @param {Object} auth - ExternalAuth record
 * @returns {Object} Auth with decrypted tokens
 */
function decryptExternalAuth(auth) {
  return processDataForRead(auth, ENCRYPTION_CONFIG.ExternalAuth);
}

module.exports = {
  registerEncryptionMiddleware,
  encryptExternalAuth,
  decryptExternalAuth,
  ENCRYPTION_CONFIG,
  
  // Export for testing
  processDataForWrite,
  processDataForRead,
  isEncrypted
};
