import { cn } from "@/lib/utils"

interface EnhancedSkeletonProps extends React.ComponentProps<"div"> {
  variant?: "default" | "card" | "text" | "avatar" | "button"
  lines?: number
}

function EnhancedSkeleton({ 
  className, 
  variant = "default", 
  lines = 1,
  ...props 
}: EnhancedSkeletonProps) {
  const baseClasses = "bg-gray-100 animate-pulse rounded-md"
  
  const variants = {
    default: baseClasses,
    card: cn(baseClasses, "p-6 space-y-4"),
    text: cn(baseClasses, "h-4"),
    avatar: cn(baseClasses, "rounded-full"),
    button: cn(baseClasses, "h-10")
  }

  if (variant === "text" && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              variants[variant],
              i === lines - 1 ? "w-3/4" : "w-full",
              className
            )}
            {...props}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(variants[variant], className)}
      {...props}
    />
  )
}

// Specialized skeleton components
export function SkeletonCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg p-6 space-y-4", className)} {...props}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <EnhancedSkeleton variant="text" className="h-6 w-32" />
          <EnhancedSkeleton variant="text" className="h-4 w-48" />
          <div className="flex gap-2">
            <EnhancedSkeleton variant="button" className="h-6 w-16" />
            <EnhancedSkeleton variant="button" className="h-6 w-20" />
          </div>
        </div>
        <EnhancedSkeleton variant="button" className="h-6 w-24" />
      </div>
      <EnhancedSkeleton variant="text" className="h-4 w-full" />
      <div className="flex gap-2">
        <EnhancedSkeleton variant="button" className="h-8 w-24" />
        <EnhancedSkeleton variant="button" className="h-8 w-32" />
      </div>
    </div>
  )
}

export function SkeletonStats({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)} {...props}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
          <EnhancedSkeleton variant="text" className="h-4 w-16" />
          <EnhancedSkeleton variant="text" className="h-8 w-20" />
          <EnhancedSkeleton variant="text" className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonFilters({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg p-6 space-y-4", className)} {...props}>
      <EnhancedSkeleton variant="text" className="h-10 w-full" />
      <div className="flex gap-2">
        <EnhancedSkeleton variant="button" className="h-10 w-32" />
        <EnhancedSkeleton variant="button" className="h-10 w-32" />
        <EnhancedSkeleton variant="button" className="h-10 w-32" />
      </div>
    </div>
  )
}

export { EnhancedSkeleton }
