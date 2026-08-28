import { GroChainLoader } from "@/components/ui/grochain-loader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="mx-auto max-w-md p-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <GroChainLoader message="" variant="compact" />
          </div>
          <CardTitle>Loading verification…</CardTitle>
          <CardDescription>Please wait while we load your verification page.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-3/4 mx-auto animate-shimmer bg-gradient-to-r from-muted via-muted-foreground/10 to-muted" />
            <div className="h-4 bg-muted rounded w-1/2 mx-auto animate-shimmer bg-gradient-to-r from-muted via-muted-foreground/10 to-muted" />
            <div className="h-4 bg-muted rounded w-2/3 mx-auto animate-shimmer bg-gradient-to-r from-muted via-muted-foreground/10 to-muted" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
