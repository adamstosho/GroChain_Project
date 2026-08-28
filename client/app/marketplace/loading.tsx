import { GroChainLoader } from "@/components/ui/grochain-loader"

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <GroChainLoader message="Loading marketplace…" variant="inline" />
    </div>
  )
}
