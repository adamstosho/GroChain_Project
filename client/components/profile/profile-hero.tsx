"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AvatarUpload } from "@/components/ui/avatar-upload"
import { Edit3, Save, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Display, Text } from "@/components/ui/typography"

interface ProfileHeroProps {
  name: string
  subtitle: ReactNode
  avatar?: string
  badges?: ReactNode
  isEditing: boolean
  isSaving?: boolean
  onToggleEdit: () => void
  onSave: () => void
  onAvatarUpdate: (url: string) => void
  isAdmin?: boolean
  stats?: ReactNode
  className?: string
}

export function ProfileHero({
  name,
  subtitle,
  avatar,
  badges,
  isEditing,
  isSaving = false,
  onToggleEdit,
  onSave,
  onAvatarUpdate,
  isAdmin = false,
  stats,
  className,
}: ProfileHeroProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm", className)}>
      {/* Gradient cover banner */}
      <div className="relative h-24 sm:h-32 bg-gradient-to-br from-primary via-primary/90 to-secondary/80">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-secondary/40 blur-2xl" aria-hidden />
        <div className="agricultural-pattern pointer-events-none absolute inset-0 opacity-20" aria-hidden />
      </div>

      <div className="relative px-4 pb-5 sm:px-8 sm:pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="-mt-12 flex flex-col items-center gap-3 text-center sm:-mt-14 sm:flex-row sm:items-end sm:gap-5 sm:text-left">
            <AvatarUpload
              currentAvatar={avatar}
              userName={name}
              onAvatarUpdate={onAvatarUpdate}
              disabled={!isEditing}
              size="xl"
              isAdmin={isAdmin}
              compact
            />
            <div className="min-w-0 space-y-1.5 pb-1">
              <Display as="h1" variant="page" className="truncate">{name}</Display>
              <Text as="p" variant="sm" className="truncate font-medium">{subtitle}</Text>
              {badges && <div className="flex flex-wrap justify-center gap-2 sm:justify-start">{badges}</div>}
            </div>
          </div>

          <div className="flex shrink-0 justify-center gap-2 sm:justify-end sm:pb-1">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={onToggleEdit} className="h-9 gap-1.5 text-xs sm:h-10 sm:text-sm">
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Cancel
                </Button>
                <Button size="sm" onClick={onSave} disabled={isSaving} className="h-9 gap-1.5 text-xs sm:h-10 sm:text-sm">
                  <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {isSaving ? "Saving..." : "Save changes"}
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={onToggleEdit} className="h-9 gap-1.5 text-xs sm:h-10 sm:text-sm">
                <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Edit profile
              </Button>
            )}
          </div>
        </div>

        {stats && <div className="mt-6 border-t border-border pt-5">{stats}</div>}
      </div>
    </div>
  )
}
