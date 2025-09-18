"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, Camera } from "lucide-react"

interface ProfilePictureUploadProps {
  currentAvatar?: string
  onAvatarChange: (avatarUrl: string) => void
  size?: "sm" | "md" | "lg"
  className?: string
}

export function ProfilePictureUpload({
  currentAvatar,
  onAvatarChange,
  size = "md",
  className = ""
}: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-24 h-24",
    lg: "w-32 h-32"
  }

  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12"
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, etc.)",
        variant: "destructive"
      })
      return
    }

    // Validate file size (max 5MB)
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
      const result = e.target?.result as string
      setPreviewUrl(result)
    }
    reader.readAsDataURL(file)

    // Upload to backend
    uploadImage(file)
  }

  const uploadImage = async (file: File) => {
    try {
      setIsUploading(true)

      // Create FormData
      const formData = new FormData()
      formData.append('avatar', file)

      // Upload to backend
      const response = await fetch('/api/users/upload-avatar', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('grochain_auth_token') || ''}`
        }
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      
      if (data.status === 'success' && data.data?.avatarUrl) {
        onAvatarChange(data.data.avatarUrl)
        toast({
          title: "Profile picture updated!",
          description: "Your new profile picture has been saved.",
        })
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveAvatar = () => {
    setPreviewUrl(null)
    onAvatarChange("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    toast({
      title: "Profile picture removed",
      description: "Your profile picture has been removed.",
    })
  }

  const getInitials = () => {
    // This would typically come from the user's name
    return "FP" // Farmer Profile initials
  }

  const displayAvatar = previewUrl || currentAvatar

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="relative">
        <Avatar className={`${sizeClasses[size]} border-4 border-white shadow-lg`}>
          <AvatarImage 
            src={displayAvatar} 
            alt="Profile picture"
            className="object-cover"
          />
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
            {getInitials()}
          </AvatarFallback>
        </Avatar>

        {/* Upload overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 hover:opacity-100 transition-opacity">
          <Camera className={`${iconSizes[size]} text-white`} />
        </div>

        {/* Remove button */}
        {displayAvatar && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
            onClick={handleRemoveAvatar}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      <div className="flex flex-col items-center space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center space-x-2"
        >
          <Upload className="w-4 h-4" />
          <span>{isUploading ? "Uploading..." : "Upload Photo"}</span>
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          JPG, PNG or GIF. Max 5MB.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}

