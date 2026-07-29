import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function hasValidJwtShapeAndExpiry(token?: string): boolean {
  if (!token) return false
  const parts = token.split('.')
  if (parts.length !== 3) return false

  try {
    const payload = JSON.parse(atob(parts[1]))
    if (typeof payload.exp !== 'number') return true
    const nowInSeconds = Math.floor(Date.now() / 1000)
    return payload.exp > nowInSeconds
  } catch {
    return false
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const hasValidToken = hasValidJwtShapeAndExpiry(token)
  
  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/profile', '/settings']
  const protectedMarketplaceRoutes = ['/marketplace/checkout', '/marketplace/order-success']
  
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  ) || protectedMarketplaceRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !hasValidToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // If accessing auth routes with token, redirect to dashboard
  if (request.nextUrl.pathname.startsWith('/auth') && hasValidToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/marketplace/checkout/:path*',
    '/marketplace/order-success/:path*',
    '/profile/:path*', 
    '/settings/:path*',
    '/auth/:path*',
    '/finance/:path*',
    '/harvests/:path*',
    '/partners/:path*',
    '/notifications/:path*'
  ],
}





