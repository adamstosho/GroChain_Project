"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { GroChainLogo } from "@/components/ui/grochain-logo"
import { useAuthGuard } from "@/lib/auth"
import { NotificationBell } from "@/components/notifications/notification-bell"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { isAuthenticated, isHydrated } = useAuthGuard()

  const navigation = [
    { name: "Features", href: "#features" },
    { name: "About", href: "#about" },
    { name: "Marketplace", href: "/marketplace" },
    { name: "Contact", href: "#contact" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <GroChainLogo variant="full" size="md" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Desktop Navigation Items */}
        <div className="hidden md:flex items-center space-x-4">
          {isHydrated && isAuthenticated && <NotificationBell />}

          {/* Desktop Auth Buttons */}
          {isHydrated ? (
            isAuthenticated ? (
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Sign Up</Link>
                </Button>
              </>
            )
          ) : (
            // Show loading state while hydrating
            <div className="h-10 w-20 bg-muted rounded animate-pulse"></div>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center space-x-2">
          {isHydrated && isAuthenticated && <NotificationBell />}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <div className="flex flex-col space-y-4 mt-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="flex flex-col space-y-2 pt-4 border-t">
                {isHydrated ? (
                  isAuthenticated ? (
                    <Button asChild>
                      <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                        Dashboard
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button variant="ghost" asChild>
                        <Link href="/login" onClick={() => setIsOpen(false)}>
                          Sign In
                        </Link>
                      </Button>
                      <Button asChild>
                        <Link href="/register" onClick={() => setIsOpen(false)}>
                          Sign Up
                        </Link>
                      </Button>
                    </>
                  )
                ) : (
                  <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
        </div>
      </div>
    </header>
  )
}
