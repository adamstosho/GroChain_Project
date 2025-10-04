"use client"

import type React from "react"

import { useState, useMemo, useCallback } from "react"
import { useAuthStore } from "@/lib/auth"
import { useBuyerStore } from "@/hooks/use-buyer-store"
import { Button } from "@/components/ui/button"
import { MemoizedAvatar } from "@/components/ui/memoized-avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  Menu,
  Home,
  Leaf,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  LogOut,
  User,
  CreditCard,
  QrCode,
  Package,
  TrendingUp,
  Shield,
  Database,
  ChevronDown,
  ChevronRight,
  Store,
  ClipboardList,
  Heart,
  ScanLine,
  Wallet,
  FileText,
  BarChart,
  Banknote,
  MessageCircle,
} from "lucide-react"
import Link from "next/link"
import { GroChainLogo } from "@/components/ui/grochain-logo"
import { useRouter, usePathname } from "next/navigation"
import { NotificationBell } from "@/components/notifications/notification-bell"

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavigationSection {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  items: NavigationItem[]
}

interface GroupedNavigation {
  type: "grouped"
  sections: NavigationSection[]
}

type NavigationItems = NavigationItem[] | GroupedNavigation

interface DashboardLayoutProps {
  children: React.ReactNode
  pageTitle?: string
}

export function DashboardLayout({ children, pageTitle }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>(['marketplace'])
  const { user, logout } = useAuthStore()
  const { cart } = useBuyerStore()
  const router = useRouter()
  const pathname = usePathname()

  // Memoize user data to prevent unnecessary re-renders
  const userData = useMemo(() => ({
    name: user?.name,
    role: user?.role,
    emailVerified: user?.emailVerified,
    avatar: user?.profile?.avatar,
    initials: user?.name ? user.name.split(" ").map((n) => n[0]).join("") : "U"
  }), [user?.name, user?.role, user?.emailVerified, user?.profile?.avatar])

  // Memoize cart count to prevent unnecessary re-renders
  const cartCount = useMemo(() => {
    return cart?.reduce((total, item) => total + (item.quantity || 0), 0) || 0
  }, [cart])

  const handleLogout = useCallback(async () => {
    try {
      // Clear auth state
      logout()
      
      // Clear any other stores that might have user data
      if (typeof window !== 'undefined') {
        // Clear any other stores
        localStorage.clear()
        sessionStorage.clear()
      }
      
      // Redirect to login page with a small delay to ensure cleanup
      setTimeout(() => {
        router.push("/login")
      }, 100)
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback: force redirect to login
      router.push("/login")
    }
  }, [logout, router])

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }, [])

  const getNavigationItems = (): NavigationItems => {
    const baseItems = [
      { name: "Dashboard", href: "/dashboard", icon: Home },
      { name: "Profile", href: "/dashboard/profile", icon: User },
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ]

    // Default to base items if no user or role
    if (!user || !user.role) {
      return baseItems
    }

    switch (user.role) {
      case "farmer":
        return [
          ...baseItems.slice(0, 1),
          { name: "Harvests", href: "/dashboard/harvests", icon: Leaf },
          { name: "Listings", href: "/dashboard/marketplace", icon: Package },
          { name: "Browse Marketplace", href: "/marketplace", icon: Store },
          { name: "Shipments", href: "/dashboard/shipments", icon: Package },
          { name: "Reviews", href: "/dashboard/reviews", icon: MessageCircle },
          // { name: "QR Codes", href: "/dashboard/qr-codes", icon: QrCode },
          { name: "Financial", href: "/dashboard/financial", icon: CreditCard },
          { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
          ...baseItems.slice(1),
        ]
      case "buyer":
        return {
          type: "grouped",
          sections: [
            {
              id: "marketplace",
              title: "Marketplace",
              icon: Store,
              items: [
                { name: "Browse Products", href: "/dashboard/products", icon: Package },
                { name: "Shopping Cart", href: "/dashboard/cart", icon: ShoppingCart },
              ]
            },
            {
              id: "orders",
              title: "Orders & Management",
              icon: ClipboardList,
              items: [
                { name: "My Orders", href: "/dashboard/orders", icon: FileText },
                { name: "Shipments", href: "/dashboard/shipments", icon: Package },
                { name: "Favorites", href: "/dashboard/favorites", icon: Heart },
              ]
            },
            {
              id: "tools",
              title: "Tools & Services",
              icon: ScanLine,
              items: [
                { name: "QR Scanner", href: "/dashboard/scanner", icon: QrCode },
                { name: "Payments", href: "/dashboard/payments", icon: Wallet },
                { name: "Analytics", href: "/dashboard/analytics", icon: BarChart },
              ]
            }
          ]
        }
      case "partner":
        return [
          ...baseItems.slice(0, 1),
          { name: "Farmers", href: "/dashboard/farmers", icon: Users },
          { name: "Referrals", href: "/dashboard/referrals", icon: TrendingUp },
          { name: "Commissions", href: "/dashboard/commissions", icon: Banknote },
          { name: "Shipments", href: "/dashboard/shipments", icon: Package },
          { name: "Approvals", href: "/dashboard/approvals", icon: Shield },
          { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
          // { name: "Onboarding", href: "/dashboard/onboarding", icon: TrendingUp },
          ...baseItems.slice(1),
        ]
      case "admin":
        return [
          ...baseItems.slice(0, 1),
          { name: "Users", href: "/dashboard/users", icon: Users },
          { name: "Approvals", href: "/dashboard/approvals", icon: Shield },
          { name: "Shipments", href: "/dashboard/shipments", icon: Package },
          { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
          { name: "System", href: "/dashboard/system", icon: Database },
          { name: "Reports", href: "/dashboard/reports", icon: TrendingUp },
          ...baseItems.slice(1),
        ]
      default:
        return baseItems
    }
  }

  const navigationItems = getNavigationItems()

  // Safety check for user object
  if (!user) {
    return (
      <div className="flex min-h-screen max-h-screen bg-background overflow-hidden">
        <div className="flex flex-1 flex-col items-center justify-center min-h-0">
          <div className="text-center space-y-4 p-4">
            <div className="h-12 w-12 sm:h-16 sm:w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-base sm:text-lg font-medium">Loading user data...</p>
          </div>
        </div>
      </div>
    )
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center">
          <GroChainLogo variant="full" size="md" />
        </Link>
      </div>

      {/* User Info */}
      <div className="border-b p-6">
        <div className="flex items-center space-x-3">
          <MemoizedAvatar
            src={userData.avatar}
            alt={userData.name || "User"}
            initials={userData.initials}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userData.name}</p>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs capitalize">
                {userData.role || "user"}
              </Badge>
              {userData.emailVerified && <div className="h-2 w-2 rounded-full bg-success" />}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {user?.role === "buyer" && 'type' in navigationItems && navigationItems.type === "grouped" ? (
          // Grouped navigation for buyers
          <>
            {/* Dashboard link */}
            <Link
              href="/dashboard"
              className={`group flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                pathname === "/dashboard"
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                  : "text-muted-foreground hover:bg-gradient-to-r hover:from-primary/20 hover:to-primary/10 hover:text-primary hover:shadow-md hover:shadow-primary/20 hover:scale-[1.02] hover:translate-x-1"
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <Home className={`h-4 w-4 transition-transform duration-200 ${
                pathname === "/dashboard" ? "" : "group-hover:rotate-12 group-hover:scale-110"
              }`} />
              <span className="transition-all duration-200">Dashboard</span>
            </Link>

            {/* Grouped sections */}
            {navigationItems.sections.map((section) => {
              const isExpanded = expandedSections.includes(section.id)
              const hasActiveItem = section.items.some(item => 
                pathname === item.href || pathname.startsWith(item.href)
              )
              
              return (
                <div key={section.id} className="space-y-1">
                  {/* Section header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={`group w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-gradient-to-r hover:from-primary/15 hover:to-primary/10 hover:text-primary hover:shadow-sm hover:shadow-primary/15 hover:scale-[1.01] ${
                      hasActiveItem
                        ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-l-2 border-primary shadow-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <section.icon className={`h-4 w-4 transition-all duration-200 ${
                        hasActiveItem ? "" : "group-hover:rotate-6 group-hover:scale-110"
                      }`} />
                      <span className="transition-all duration-200">{section.title}</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-all duration-200 ${
                      isExpanded ? "rotate-0" : "-rotate-90"
                    } group-hover:scale-110`} />
                  </button>

                  {/* Section items */}
                  {isExpanded && (
                    <div className="ml-6 space-y-1 border-l border-border/30 pl-3">
                      {section.items.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href)
                        
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={`group flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                              isActive
                                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                                : "text-muted-foreground hover:bg-gradient-to-r hover:from-primary/20 hover:to-primary/10 hover:text-primary hover:shadow-md hover:shadow-primary/15 hover:scale-[1.02] hover:translate-x-0.5"
                            }`}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <item.icon className={`h-4 w-4 transition-all duration-200 ${
                              isActive ? "" : "group-hover:rotate-12 group-hover:scale-110"
                            }`} />
                            <span className="transition-all duration-200">{item.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Profile and Settings */}
            <div className="pt-4 border-t border-border/50">
              <Link
                href="/dashboard/profile"
                className={`group flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 mb-1 ${
                  pathname === "/dashboard/profile"
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                    : "text-muted-foreground hover:bg-gradient-to-r hover:from-primary/20 hover:to-primary/10 hover:text-primary hover:shadow-md hover:shadow-primary/15 hover:scale-[1.02] hover:translate-x-1"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <User className={`h-4 w-4 transition-all duration-200 ${
                  pathname === "/dashboard/profile" ? "" : "group-hover:rotate-12 group-hover:scale-110"
                }`} />
                <span className="transition-all duration-200">Profile</span>
              </Link>

              <Link
                href="/dashboard/settings"
                className={`group flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  pathname === "/dashboard/settings"
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                    : "text-muted-foreground hover:bg-gradient-to-r hover:from-primary/20 hover:to-primary/10 hover:text-primary hover:shadow-md hover:shadow-primary/15 hover:scale-[1.02] hover:translate-x-1"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Settings className={`h-4 w-4 transition-all duration-200 ${
                  pathname === "/dashboard/settings" ? "" : "group-hover:rotate-12 group-hover:scale-110"
                }`} />
                <span className="transition-all duration-200">Settings</span>
              </Link>
            </div>
          </>
        ) : (
          // Regular navigation for other roles
          (navigationItems as NavigationItem[]).map((item) => {
            const isActive = pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                    : "text-muted-foreground hover:bg-gradient-to-r hover:from-primary/20 hover:to-primary/10 hover:text-primary hover:shadow-md hover:shadow-primary/15 hover:scale-[1.02] hover:translate-x-1"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={`h-4 w-4 transition-all duration-200 ${
                  isActive ? "" : "group-hover:rotate-12 group-hover:scale-110"
                }`} />
                <span className="transition-all duration-200">{item.name}</span>
              </Link>
            )
          })
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/50 p-4">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="group w-full justify-start text-muted-foreground hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:text-red-600 hover:shadow-md hover:shadow-red-100/50 transition-all duration-200 hover:scale-[1.02]"
        >
          <LogOut className="mr-3 h-4 w-4 transition-all duration-200 group-hover:rotate-12 group-hover:scale-110" />
          <span className="transition-all duration-200">Sign Out</span>
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen max-h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:border-r lg:overflow-hidden lg:shrink-0 lg:relative lg:z-20 bg-background">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-h-0 min-w-0 relative z-0">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6 flex-shrink-0 relative z-10">
          <div className="flex items-center space-x-4">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>

            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-semibold truncate">
                {pageTitle || (() => {
                  if (userData.role === "farmer") return "Farmer Dashboard"
                  if (userData.role === "buyer") return "Buyer Dashboard"
                  if (userData.role === "partner") return "Partner Dashboard"
                  if (userData.role === "admin") return "Admin Dashboard"
                  return "Dashboard"
                })()}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                Welcome back, {userData.name ? userData.name.split(" ")[0] : "User"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Cart Icon for Buyers */}
            {userData.role === "buyer" && (
              <Button variant="ghost" size="icon" className="relative" asChild>
                <Link href="/dashboard/cart">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center font-medium">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </Link>
              </Button>
            )}

            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <MemoizedAvatar
                    src={userData.avatar}
                    alt={userData.name || "User"}
                    initials={userData.initials}
                    size="sm"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userData.name || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || "No email"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50/50 min-h-0">
          <div className="container mx-auto px-4 py-6 lg:px-6 lg:py-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
