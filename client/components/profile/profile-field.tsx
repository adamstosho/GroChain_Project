"use client"

import type { LucideIcon } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SelectOption {
  value: string
  label: string
}

interface ProfileFieldProps {
  label: string
  value: string
  onChange?: (value: string) => void
  isEditing: boolean
  type?: "text" | "email" | "number" | "tel" | "textarea" | "select"
  options?: SelectOption[]
  placeholder?: string
  /** Force read-only display even while the form is in edit mode (e.g. email). */
  locked?: boolean
  icon?: LucideIcon
  rows?: number
  className?: string
  emptyText?: string
  required?: boolean
}

/**
 * Renders a labeled field that shows a clean read-only row outside edit mode
 * and the real input/select/textarea while editing — avoids a wall of greyed
 * out disabled inputs.
 */
export function ProfileField({
  label,
  value,
  onChange,
  isEditing,
  type = "text",
  options,
  placeholder,
  locked = false,
  icon: Icon,
  rows = 3,
  className,
  emptyText = "Not set",
  required = false,
}: ProfileFieldProps) {
  const editable = isEditing && !locked

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
        {required && editable && <span className="ml-0.5 text-destructive">*</span>}
      </Label>

      {editable ? (
        type === "textarea" ? (
          <Textarea
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="resize-none text-sm"
          />
        ) : type === "select" ? (
          <Select value={value} onValueChange={(v) => onChange?.(v)}>
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options?.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            type={type}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className="h-10 text-sm"
          />
        )
      ) : (
        <div
          className={cn(
            "flex min-h-9 items-start gap-2 rounded-lg px-0 py-1.5 text-sm text-foreground",
            !value && "italic text-muted-foreground",
            locked && isEditing && "text-muted-foreground"
          )}
        >
          {Icon && <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          <span className="break-words">
            {(type === "select" ? options?.find((o) => o.value === value)?.label : value) || value || emptyText}
          </span>
        </div>
      )}
    </div>
  )
}

interface ProfileTagFieldProps {
  label: string
  values: string[]
  onChange?: (values: string[]) => void
  isEditing: boolean
  placeholder?: string
  emptyText?: string
  className?: string
}

/** Comma-separated input while editing; chip badges in the read view. */
export function ProfileTagField({
  label,
  values,
  onChange,
  isEditing,
  placeholder,
  emptyText = "None specified",
  className,
}: ProfileTagFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {isEditing ? (
        <Input
          value={values.join(", ")}
          onChange={(e) =>
            onChange?.(
              e.target.value
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean)
            )
          }
          placeholder={placeholder}
          className="h-10 text-sm"
        />
      ) : values.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v, i) => (
            <Badge key={`${v}-${i}`} variant="secondary" className="font-normal capitalize">
              {v}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm italic text-muted-foreground">{emptyText}</p>
      )}
    </div>
  )
}
