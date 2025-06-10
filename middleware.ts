import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import rateLimit from 'express-rate-limit'
import { createClient } from '@supabase/supabase-js'

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

// CORS configuration
const allowedOrigins = ['http://localhost:3000', 'https://your-production-domain.com']

export function middleware(request: NextRequest) {
  // CORS validation
  const origin = request.headers.get('origin')
  if (!allowedOrigins.includes(origin || '')) {
    return new NextResponse('CORS not allowed', { status: 403 })
  }

  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    const response = NextResponse.next()
    
    // Apply rate limit
    limiter(request, response)
    
    // IP blocking list
    const blockedIPs = ['123.45.67.89'] // Add known malicious IPs here
    const clientIP = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0]
    
    if (blockedIPs.includes(clientIP)) {
      return new NextResponse('Access denied', { status: 403 })
    }
    
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
