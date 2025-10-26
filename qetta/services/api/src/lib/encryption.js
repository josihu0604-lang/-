/**
 * Encryption Utilities for Sensitive Data
 * 
 * Uses AES-256-GCM for encrypting OAuth tokens, credentials, and other sensitive data
 * 
 * Key Management:
 * - ENCRYPTION_KEY: 32-byte base64-encoded key from environment
 * - IV (Initialization Vector): 16 random bytes per encryption
 * - Auth Tag: 16 bytes for data integrity verification
 * 
 * Encrypted format: iv:authTag:encryptedData (all base64)
 */

const crypto = require('crypto');

// Algorithm configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment
 * Generates a random key if not set (development only)
 */
function getEncryptionKey() {
  const keyEnv = process.env.ENCRYPTION_KEY;
  
  if (!keyEnv) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY must be set in production');
    }
    
    // Development: generate random key (not persisted)
    console.warn('⚠️  ENCRYPTION_KEY not set. Generating random key for development.');
    console.warn('⚠️  This key is NOT persisted. Set ENCRYPTION_KEY in .env for production.');
    return crypto.randomBytes(KEY_LENGTH);
  }
  
  // Decode base64 key from environment
  const key = Buffer.from(keyEnv, 'base64');
  
  if (key.length !== KEY_LENGTH) {
    throw new Error(`Invalid ENCRYPTION_KEY length. Expected ${KEY_LENGTH} bytes, got ${key.length}`);
  }
  
  return key;
}

/**
 * Generate a new encryption key (for initial setup)
 * 
 * @returns {string} Base64-encoded 256-bit key
 * 
 * @example
 * const key = generateKey();
 * // Add to .env: ENCRYPTION_KEY="<key>"
 */
function generateKey() {
  const key = crypto.randomBytes(KEY_LENGTH);
  return key.toString('base64');
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * 
 * @param {string} plaintext - Data to encrypt
 * @returns {string} Encrypted data in format: iv:authTag:ciphertext (base64)
 * 
 * @example
 * const encrypted = encrypt('my-oauth-token');
 * // Returns: "a1b2c3d4....:e5f6g7h8....:i9j0k1l2...."
 */
function encrypt(plaintext) {
  if (!plaintext) {
    return null;
  }
  
  if (typeof plaintext !== 'string') {
    throw new TypeError('Plaintext must be a string');
  }
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt data
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:encryptedData
    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted
    ].join(':');
    
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt data encrypted with encrypt()
 * 
 * @param {string} encryptedData - Encrypted string from encrypt()
 * @returns {string} Original plaintext
 * 
 * @example
 * const plaintext = decrypt(encrypted);
 * // Returns: "my-oauth-token"
 */
function decrypt(encryptedData) {
  if (!encryptedData) {
    return null;
  }
  
  if (typeof encryptedData !== 'string') {
    throw new TypeError('Encrypted data must be a string');
  }
  
  try {
    const key = getEncryptionKey();
    
    // Parse encrypted format
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [ivBase64, authTagBase64, encrypted] = parts;
    
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length: ${iv.length}`);
    }
    
    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error(`Invalid auth tag length: ${authTag.length}`);
    }
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt data
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
    
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Hash sensitive data using SHA-256 (one-way)
 * Useful for searchable encrypted fields (e.g., email lookup)
 * 
 * @param {string} data - Data to hash
 * @returns {string} Hex-encoded hash
 * 
 * @example
 * const hash = hashData('user@example.com');
 * // Can be used as unique index in database
 */
function hashData(data) {
  if (!data) {
    return null;
  }
  
  if (typeof data !== 'string') {
    throw new TypeError('Data must be a string');
  }
  
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Encrypt an object's specific fields
 * 
 * @param {Object} obj - Object to encrypt
 * @param {string[]} fields - Field names to encrypt
 * @returns {Object} New object with encrypted fields
 * 
 * @example
 * const user = { email: 'test@example.com', password: 'secret' };
 * const encrypted = encryptFields(user, ['password']);
 * // { email: 'test@example.com', password: 'iv:tag:encrypted...' }
 */
function encryptFields(obj, fields) {
  if (!obj || typeof obj !== 'object') {
    throw new TypeError('Object required');
  }
  
  if (!Array.isArray(fields)) {
    throw new TypeError('Fields must be an array');
  }
  
  const result = { ...obj };
  
  for (const field of fields) {
    if (field in result && result[field] !== null && result[field] !== undefined) {
      result[field] = encrypt(String(result[field]));
    }
  }
  
  return result;
}

/**
 * Decrypt an object's specific fields
 * 
 * @param {Object} obj - Object to decrypt
 * @param {string[]} fields - Field names to decrypt
 * @returns {Object} New object with decrypted fields
 * 
 * @example
 * const decrypted = decryptFields(encrypted, ['password']);
 * // { email: 'test@example.com', password: 'secret' }
 */
function decryptFields(obj, fields) {
  if (!obj || typeof obj !== 'object') {
    throw new TypeError('Object required');
  }
  
  if (!Array.isArray(fields)) {
    throw new TypeError('Fields must be an array');
  }
  
  const result = { ...obj };
  
  for (const field of fields) {
    if (field in result && result[field] !== null && result[field] !== undefined) {
      try {
        result[field] = decrypt(String(result[field]));
      } catch (error) {
        // If decryption fails, field might not be encrypted
        console.warn(`Failed to decrypt field '${field}':`, error.message);
      }
    }
  }
  
  return result;
}

/**
 * Encrypt ExternalAuth tokens (accessToken, refreshToken)
 * 
 * @param {Object} auth - ExternalAuth object
 * @returns {Object} Auth with encrypted tokens
 */
function encryptAuthTokens(auth) {
  return encryptFields(auth, ['accessToken', 'refreshToken']);
}

/**
 * Decrypt ExternalAuth tokens (accessToken, refreshToken)
 * 
 * @param {Object} auth - ExternalAuth object with encrypted tokens
 * @returns {Object} Auth with decrypted tokens
 */
function decryptAuthTokens(auth) {
  return decryptFields(auth, ['accessToken', 'refreshToken']);
}

module.exports = {
  generateKey,
  encrypt,
  decrypt,
  hashData,
  encryptFields,
  decryptFields,
  encryptAuthTokens,
  decryptAuthTokens,
  
  // Constants for external use
  ALGORITHM,
  IV_LENGTH,
  AUTH_TAG_LENGTH,
  KEY_LENGTH
};
