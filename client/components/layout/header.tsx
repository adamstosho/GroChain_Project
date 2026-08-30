"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { GroChainLogo } from "@/components/ui/grochain-logo"
import { useAuthGuard } from "@/lib/auth"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { cn } from "@/lib/utils"
import { layout, zIndex } from "@/lib/design-system"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { isAuthenticated, isHydrated } = useAuthGuard()
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const navigation = [
    { name: "Features", href: "#features" },
    { name: "About", href: "#about" },
    { name: "Marketplace", href: "/marketplace" },
    { name: "Contact", href: "#contact" },
  ]

  return (
    <motion.header
      className={cn(
        "sticky top-0 w-full border-b bg-background/95 backdrop-blur transition-shadow duration-300 supports-[backdrop-filter]:bg-background/60",
        zIndex.header,
        scrolled && "shadow-sm shadow-primary/5"
      )}
      initial={prefersReduced ? false : { y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={cn("container flex items-center justify-between", layout.headerHeight, layout.containerX)}>
        <Link href="/" className="flex items-center group">
          <motion.div whileHover={prefersReduced ? undefined : { scale: 1.02 }} transition={{ duration: 0.2 }}>
            <GroChainLogo variant="full" size="md" />
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navigation.map((item, i) => (
            <motion.div
              key={item.name}
              initial={prefersReduced ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.35 }}
            >
              <Link
                href={item.href}
                className="relative text-sm font-medium text-muted-foreground hover:text-primary transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
              >
                {item.name}
              </Link>
            </motion.div>
          ))}
        </nav>

        {/* Desktop Navigation Items */}
        <div className="hidden md:flex items-center space-x-4">
          {isHydrated && isAuthenticated && <NotificationBell />}

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
            <div className="h-10 w-20 bg-muted rounded animate-pulse" />
          )}
        </div>

        {/* Mobile Menu — Sheet mounts client-side only to avoid Radix ID hydration mismatch */}
        <div className="md:hidden flex items-center space-x-2">
          {isHydrated && isAuthenticated && <NotificationBell />}
          {mounted ? (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-8">
                  {navigation.map((item, i) => (
                    <motion.div
                      key={item.name}
                      initial={prefersReduced ? false : { opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i, duration: 0.3 }}
                    >
                      <Link
                        href={item.href}
                        className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors block py-1"
                        onClick={() => setIsOpen(false)}
                      >
                        {item.name}
                      </Link>
                    </motion.div>
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
                      <div className="h-10 w-full bg-muted rounded animate-pulse" />
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  )
}
