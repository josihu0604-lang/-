/**
 * Prisma Client Configuration
 * 
 * Includes automatic encryption middleware for sensitive fields
 */

const { PrismaClient } = require('@prisma/client');
const { registerEncryptionMiddleware } = require('./middleware/prisma-encryption');

// Initialize Prisma client with logging
const prisma = new PrismaClient({
  log: ['warn', 'error']
});

// Register encryption middleware for automatic encrypt/decrypt
registerEncryptionMiddleware(prisma);

module.exports = { prisma };
