"use client"

import { useToaster } from "@/hooks/use-toast"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToastItemProps {
  toast: {
    id: string
    title?: string
    description?: string
    variant?: 'default' | 'destructive' | 'success'
  }
  onClose: (id: string) => void
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const getIcon = () => {
    switch (toast.variant) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "destructive":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getBorderColor = () => {
    switch (toast.variant) {
      case "success":
        return "border-l-green-500"
      case "destructive":
        return "border-l-red-500"
      default:
        return "border-l-blue-500"
    }
  }

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 w-80 shadow-lg border-l-4 bg-background border rounded-md p-4 transition-all duration-300",
        getBorderColor()
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          {toast.title && (
            <h4 className="text-sm font-semibold text-foreground mb-1">
              {toast.title}
            </h4>
          )}
          {toast.description && (
            <p className="text-sm text-muted-foreground">
              {toast.description}
            </p>
          )}
        </div>
        <button
          onClick={() => onClose(toast.id)}
          className="flex-shrink-0 h-6 w-6 rounded-md border border-transparent hover:border-border flex items-center justify-center transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

export function Toaster() {
  const { toasts } = useToaster()

  return (
    <div className="fixed top-0 right-0 z-50 space-y-2 p-4 pointer-events-none">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className="pointer-events-auto"
          style={{
            transform: `translateY(${index * 8}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        >
          <ToastItem
            toast={toast}
            onClose={(id) => {
              // The toast will auto-remove via the timeout in the manager
              // We don't need to manually remove it here
            }}
          />
        </div>
      ))}
    </div>
  )
}
