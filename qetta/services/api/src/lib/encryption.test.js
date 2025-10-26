/**
 * Tests for Encryption Utilities
 * 
 * Run with: npm test -- encryption.test.js
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');

// Import encryption module
const {
  generateKey,
  encrypt,
  decrypt,
  hashData,
  encryptFields,
  decryptFields,
  encryptAuthTokens,
  decryptAuthTokens,
  ALGORITHM,
  IV_LENGTH,
  AUTH_TAG_LENGTH,
  KEY_LENGTH
} = require('./encryption');

describe('Encryption Utilities', () => {
  
  let originalKey;
  
  beforeEach(() => {
    // Save original key
    originalKey = process.env.ENCRYPTION_KEY;
    // Set test key
    process.env.ENCRYPTION_KEY = crypto.randomBytes(KEY_LENGTH).toString('base64');
  });
  
  afterEach(() => {
    // Restore original key
    if (originalKey) {
      process.env.ENCRYPTION_KEY = originalKey;
    } else {
      delete process.env.ENCRYPTION_KEY;
    }
  });
  
  describe('generateKey()', () => {
    it('should generate a valid 256-bit key', () => {
      const key = generateKey();
      
      assert.strictEqual(typeof key, 'string');
      
      const keyBuffer = Buffer.from(key, 'base64');
      assert.strictEqual(keyBuffer.length, KEY_LENGTH);
    });
    
    it('should generate different keys each time', () => {
      const key1 = generateKey();
      const key2 = generateKey();
      
      assert.notStrictEqual(key1, key2);
    });
  });
  
  describe('encrypt() and decrypt()', () => {
    it('should encrypt and decrypt a string', () => {
      const plaintext = 'my-oauth-access-token';
      
      const encrypted = encrypt(plaintext);
      assert.strictEqual(typeof encrypted, 'string');
      assert.notStrictEqual(encrypted, plaintext);
      
      const decrypted = decrypt(encrypted);
      assert.strictEqual(decrypted, plaintext);
    });
    
    it('should handle special characters', () => {
      const plaintext = '한글 テスト 🔐 special@chars#123';
      
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      assert.strictEqual(decrypted, plaintext);
    });
    
    it('should produce different ciphertext for same plaintext', () => {
      const plaintext = 'same-token';
      
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);
      
      // Different IVs produce different ciphertext
      assert.notStrictEqual(encrypted1, encrypted2);
      
      // But both decrypt to same plaintext
      assert.strictEqual(decrypt(encrypted1), plaintext);
      assert.strictEqual(decrypt(encrypted2), plaintext);
    });
    
    it('should return null for null/undefined input', () => {
      assert.strictEqual(encrypt(null), null);
      assert.strictEqual(encrypt(undefined), null);
      assert.strictEqual(decrypt(null), null);
      assert.strictEqual(decrypt(undefined), null);
    });
    
    it('should throw error for non-string input', () => {
      assert.throws(() => encrypt(123), /must be a string/);
      assert.throws(() => encrypt({ key: 'value' }), /must be a string/);
      assert.throws(() => decrypt(123), /must be a string/);
    });
    
    it('should format encrypted data correctly', () => {
      const encrypted = encrypt('test');
      const parts = encrypted.split(':');
      
      assert.strictEqual(parts.length, 3);
      
      // Check IV length
      const iv = Buffer.from(parts[0], 'base64');
      assert.strictEqual(iv.length, IV_LENGTH);
      
      // Check auth tag length
      const authTag = Buffer.from(parts[1], 'base64');
      assert.strictEqual(authTag.length, AUTH_TAG_LENGTH);
      
      // Encrypted data should be base64
      assert.doesNotThrow(() => Buffer.from(parts[2], 'base64'));
    });
    
    it('should fail decryption with wrong key', () => {
      const plaintext = 'secret-token';
      const encrypted = encrypt(plaintext);
      
      // Change key
      process.env.ENCRYPTION_KEY = crypto.randomBytes(KEY_LENGTH).toString('base64');
      
      assert.throws(() => decrypt(encrypted), /Decryption failed/);
    });
    
    it('should fail decryption with tampered data', () => {
      const encrypted = encrypt('test');
      const parts = encrypted.split(':');
      
      // Tamper with encrypted data
      const tampered = parts[0] + ':' + parts[1] + ':' + 'tampered';
      
      assert.throws(() => decrypt(tampered), /Decryption failed/);
    });
    
    it('should fail decryption with invalid format', () => {
      assert.throws(() => decrypt('invalid'), /Invalid encrypted data format/);
      assert.throws(() => decrypt('a:b'), /Invalid encrypted data format/);
      assert.throws(() => decrypt('a:b:c:d'), /Invalid encrypted data format/);
    });
  });
  
  describe('hashData()', () => {
    it('should hash data deterministically', () => {
      const data = 'user@example.com';
      
      const hash1 = hashData(data);
      const hash2 = hashData(data);
      
      assert.strictEqual(hash1, hash2);
      assert.strictEqual(typeof hash1, 'string');
      assert.strictEqual(hash1.length, 64); // SHA-256 = 64 hex chars
    });
    
    it('should produce different hashes for different data', () => {
      const hash1 = hashData('user1@example.com');
      const hash2 = hashData('user2@example.com');
      
      assert.notStrictEqual(hash1, hash2);
    });
    
    it('should return null for null/undefined', () => {
      assert.strictEqual(hashData(null), null);
      assert.strictEqual(hashData(undefined), null);
    });
    
    it('should throw error for non-string input', () => {
      assert.throws(() => hashData(123), /must be a string/);
    });
  });
  
  describe('encryptFields() and decryptFields()', () => {
    it('should encrypt specific fields in an object', () => {
      const obj = {
        id: '123',
        email: 'test@example.com',
        password: 'secret123',
        publicData: 'visible'
      };
      
      const encrypted = encryptFields(obj, ['password']);
      
      assert.strictEqual(encrypted.id, obj.id);
      assert.strictEqual(encrypted.email, obj.email);
      assert.strictEqual(encrypted.publicData, obj.publicData);
      assert.notStrictEqual(encrypted.password, obj.password);
      
      const decrypted = decryptFields(encrypted, ['password']);
      assert.strictEqual(decrypted.password, obj.password);
    });
    
    it('should encrypt multiple fields', () => {
      const obj = {
        accessToken: 'token123',
        refreshToken: 'refresh456',
        userId: 'user-1'
      };
      
      const encrypted = encryptFields(obj, ['accessToken', 'refreshToken']);
      
      assert.notStrictEqual(encrypted.accessToken, obj.accessToken);
      assert.notStrictEqual(encrypted.refreshToken, obj.refreshToken);
      assert.strictEqual(encrypted.userId, obj.userId);
      
      const decrypted = decryptFields(encrypted, ['accessToken', 'refreshToken']);
      assert.strictEqual(decrypted.accessToken, obj.accessToken);
      assert.strictEqual(decrypted.refreshToken, obj.refreshToken);
    });
    
    it('should handle null/undefined fields', () => {
      const obj = {
        field1: 'value',
        field2: null,
        field3: undefined
      };
      
      const encrypted = encryptFields(obj, ['field1', 'field2', 'field3']);
      
      assert.notStrictEqual(encrypted.field1, obj.field1);
      assert.strictEqual(encrypted.field2, null);
      assert.strictEqual(encrypted.field3, undefined);
    });
    
    it('should not modify original object', () => {
      const obj = { password: 'secret' };
      const objCopy = { ...obj };
      
      encryptFields(obj, ['password']);
      
      assert.deepStrictEqual(obj, objCopy);
    });
  });
  
  describe('encryptAuthTokens() and decryptAuthTokens()', () => {
    it('should encrypt and decrypt ExternalAuth tokens', () => {
      const auth = {
        id: 'auth-123',
        userId: 'user-1',
        provider: 'KFTC_OPENBANKING',
        accessToken: 'access-token-xyz',
        refreshToken: 'refresh-token-abc',
        expiresAt: new Date()
      };
      
      const encrypted = encryptAuthTokens(auth);
      
      assert.strictEqual(encrypted.id, auth.id);
      assert.strictEqual(encrypted.userId, auth.userId);
      assert.strictEqual(encrypted.provider, auth.provider);
      assert.notStrictEqual(encrypted.accessToken, auth.accessToken);
      assert.notStrictEqual(encrypted.refreshToken, auth.refreshToken);
      
      const decrypted = decryptAuthTokens(encrypted);
      
      assert.strictEqual(decrypted.accessToken, auth.accessToken);
      assert.strictEqual(decrypted.refreshToken, auth.refreshToken);
    });
    
    it('should handle auth without refresh token', () => {
      const auth = {
        id: 'auth-123',
        accessToken: 'access-token',
        refreshToken: null
      };
      
      const encrypted = encryptAuthTokens(auth);
      const decrypted = decryptAuthTokens(encrypted);
      
      assert.strictEqual(decrypted.accessToken, auth.accessToken);
      assert.strictEqual(decrypted.refreshToken, null);
    });
  });
  
  describe('Key management', () => {
    it('should throw error in production without ENCRYPTION_KEY', () => {
      delete process.env.ENCRYPTION_KEY;
      process.env.NODE_ENV = 'production';
      
      assert.throws(() => encrypt('test'), /ENCRYPTION_KEY must be set in production/);
      
      delete process.env.NODE_ENV;
    });
    
    it('should use random key in development without ENCRYPTION_KEY', () => {
      delete process.env.ENCRYPTION_KEY;
      process.env.NODE_ENV = 'development';
      
      // Should work without error
      const encrypted = encrypt('test');
      assert.strictEqual(typeof encrypted, 'string');
      
      delete process.env.NODE_ENV;
    });
    
    it('should throw error for invalid key length', () => {
      process.env.ENCRYPTION_KEY = crypto.randomBytes(16).toString('base64'); // Wrong length
      
      assert.throws(() => encrypt('test'), /Invalid ENCRYPTION_KEY length/);
    });
  });
  
  describe('Performance', () => {
    it('should handle large strings efficiently', () => {
      const largeString = 'x'.repeat(10000);
      
      const start = Date.now();
      const encrypted = encrypt(largeString);
      const decrypted = decrypt(encrypted);
      const duration = Date.now() - start;
      
      assert.strictEqual(decrypted, largeString);
      assert.ok(duration < 100, `Took ${duration}ms, should be < 100ms`);
    });
    
    it('should handle many encryptions efficiently', () => {
      const count = 100;
      const start = Date.now();
      
      for (let i = 0; i < count; i++) {
        const encrypted = encrypt(`token-${i}`);
        decrypt(encrypted);
      }
      
      const duration = Date.now() - start;
      const avgTime = duration / count;
      
      assert.ok(avgTime < 10, `Average ${avgTime}ms per encrypt+decrypt, should be < 10ms`);
    });
  });
});
