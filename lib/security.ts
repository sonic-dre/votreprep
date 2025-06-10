export const securityConfig = {
  // Rate limiting
  apiRateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests from this IP, please try again later.',
  },

  // CORS
  cors: {
    allowedOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },

  // Security headers
  headers: {
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    xXSSProtection: '1; mode=block',
    referrerPolicy: 'strict-origin-when-cross-origin',
    hsts: 'max-age=31536000; includeSubDomains; preload',
    contentSecurityPolicy: {
      defaultSrc: ['self'],
      scriptSrc: ['self', 'unsafe-inline', 'unsafe-eval', 'https://*.googleapis.com', 'https://*.gstatic.com'],
      styleSrc: ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
      imgSrc: ['self', 'data:'],
      connectSrc: ['self', 'https://*.firebaseio.com', 'https://*.googleapis.com'],
      fontSrc: ['self', 'https://fonts.gstatic.com'],
    },
  },

  // IP blocking
  ipBlocking: {
    blockedIPs: process.env.BLOCKED_IPS?.split(',') || [],
    whitelistIPs: process.env.WHITELIST_IPS?.split(',') || [],
  },

  // API security
  apiSecurity: {
    maxBodySize: '1mb',
    timeout: 30000, // 30 seconds
    validateRequest: true,
  },
}
