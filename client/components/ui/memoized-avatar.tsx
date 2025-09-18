"use client"

import React, { memo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"

interface MemoizedAvatarProps {
  src?: string
  alt?: string
  initials: string
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10", 
  lg: "h-12 w-12"
}

export const MemoizedAvatar = memo<MemoizedAvatarProps>(({ 
  src, 
  alt = "User", 
  initials, 
  className = "",
  size = "md"
}) => {
  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage 
        src={src || undefined} 
        alt={alt}
        onError={(e) => {
          // Prevent broken image from causing re-renders
          e.currentTarget.style.display = 'none'
        }}
      />
      <AvatarFallback>
        {initials}
      </AvatarFallback>
    </Avatar>
  )
})

MemoizedAvatar.displayName = "MemoizedAvatar"