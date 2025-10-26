const Redis = require('ioredis'); const { redisUrl } = require('./config'); const redis = redisUrl ? new Redis(redisUrl) : null; module.exports={redis};
