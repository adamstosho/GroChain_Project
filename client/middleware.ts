import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  
  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/marketplace', '/profile', '/settings']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // If accessing auth routes with token, redirect to dashboard
  if (request.nextUrl.pathname.startsWith('/auth') && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/marketplace/:path*', 
    '/profile/:path*', 
    '/settings/:path*',
    '/auth/:path*',
    '/finance/:path*',
    '/harvests/:path*',
    '/partners/:path*',
    '/notifications/:path*'
  ],
}





