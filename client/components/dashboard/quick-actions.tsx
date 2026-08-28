import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { textStyles } from "@/lib/design-system"
import { cn } from "@/lib/utils"

interface QuickAction {
  title: string
  description: string
  icon: LucideIcon
  href: string
  color: string
}

interface QuickActionsProps {
  actions: QuickAction[]
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className={textStyles.cardTitle}>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-3 sm:p-4 justify-start hover:bg-primary-soft text-left"
              asChild
            >
              <Link href={action.href}>
                <div className="flex items-center space-x-3 w-full">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${action.color}`}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{action.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
