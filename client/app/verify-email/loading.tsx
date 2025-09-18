import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Loading() {
  return (
    <div className="mx-auto max-w-md p-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <div className="h-8 w-8 bg-blue-600 rounded-full animate-pulse" />
          </div>
          <CardTitle>Loading verification...</CardTitle>
          <CardDescription>
            Please wait while we load your verification page.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-3/4 mx-auto animate-pulse" />
            <div className="h-4 bg-muted rounded w-1/2 mx-auto animate-pulse" />
            <div className="h-4 bg-muted rounded w-2/3 mx-auto animate-pulse" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
