"use client"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Camera, Upload, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { getTokenFromStorage } from "@/lib/auth-storage"
import { getErrorMessage } from "@/lib/error-utils"

interface AvatarUploadProps {
  currentAvatar?: string
  userName?: string
  onAvatarUpdate: (newAvatarUrl: string) => void
  disabled?: boolean
  size?: "sm" | "md" | "lg" | "xl"
  isAdmin?: boolean
  /** Hide the "Change Photo" button + helper caption; rely on the hover overlay only. Use inside compact hero layouts. */
  compact?: boolean
}

export function AvatarUpload({
  currentAvatar,
  userName,
  onAvatarUpdate,
  disabled = false,
  size = "lg",
  isAdmin = false,
  compact = false
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { toast } = useToast()

  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-20 w-20",
    xl: "h-24 w-24 sm:h-28 sm:w-28"
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Reset the input's value immediately so selecting the same file again
    // (e.g. retrying after a failed or cancelled upload) always fires onChange.
    event.target.value = ''
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, GIF, etc.)",
        variant: "destructive"
      })
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    handleUpload(file)
  }

  const handleUpload = async (file: File) => {
    // Cancel any upload already in flight before starting a new one
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setIsUploading(true)

      const token = getTokenFromStorage()
      if (!token) {
        throw new Error('User is not authenticated. Please log in again.')
      }

      const formData = new FormData()
      formData.append('avatar', file)

      const result = await apiService.uploadAvatar(formData, isAdmin, controller.signal)

      if (result.status === 'success') {
        onAvatarUpdate(result.data.avatar)
        setPreviewUrl(null)
        toast({
          title: "Avatar updated",
          description: "Your profile picture has been updated successfully",
          variant: "default"
        })
      } else {
        throw new Error(result.message || 'Failed to upload avatar')
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        // User cancelled - no error toast, state already reset by handleRemove
        return
      }
      console.error('Avatar upload error:', error)
      setPreviewUrl(null)
      toast({
        title: "Upload failed",
        description: getErrorMessage(error, "Failed to upload avatar. Please try again."),
        variant: "destructive"
      })
    } finally {
      if (abortControllerRef.current === controller) {
        setIsUploading(false)
        abortControllerRef.current = null
      }
    }
  }

  const handleRemove = () => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setIsUploading(false)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return "U"
    return name.split(" ").map(n => n[0]).join("").toUpperCase()
  }

  return (
    <div className={compact ? "" : "flex flex-col items-center space-y-4"}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Avatar Display */}
      <div className="relative shrink-0">
        <Avatar className={`${sizeClasses[size]} border-4 border-background shadow-lg ring-1 ring-border`}>
          <AvatarImage
            src={previewUrl || currentAvatar || undefined}
            alt={userName || "Profile"}
          />
          <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>

        {isUploading && (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}

        {/* Upload Overlay */}
        {!disabled && !isUploading && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 opacity-0 transition-all duration-200 hover:bg-black/50 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
            aria-label="Change profile photo"
          >
            <Camera className="h-5 w-5 text-white" />
          </button>
        )}

        {/* Remove Preview Button */}
        {previewUrl && (
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-1 -right-1 h-6 w-6 p-0 rounded-full"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Upload Button */}
      {!disabled && !compact && (
        <div className="flex flex-col items-center space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>{isUploading ? "Uploading..." : "Change Photo"}</span>
          </Button>

          <p className="text-xs text-muted-foreground text-center max-w-xs">
            JPG, PNG, GIF up to 5MB. Images are automatically cropped to square.
          </p>
        </div>
      )}
    </div>
  )
}
