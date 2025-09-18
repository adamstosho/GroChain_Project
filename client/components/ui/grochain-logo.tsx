"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface GroChainLogoProps {
  variant?: "full" | "icon" | "text"
  size?: "sm" | "md" | "lg" | "xl"
  animated?: boolean
  className?: string
}

export function GroChainLogo({ 
  variant = "full", 
  size = "md", 
  animated = false,
  className 
}: GroChainLogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  }

  const textSizes = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl", 
    xl: "text-3xl"
  }

  if (variant === "icon") {
    return (
      <div className={cn("flex items-center justify-center", sizeClasses[size], className)}>
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 64 64" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          <defs>
            <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#2d5a3d", stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:"#1e3d2a", stopOpacity:1}} />
            </linearGradient>
            <linearGradient id="chainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#2d5a3d", stopOpacity:0.9}} />
              <stop offset="100%" style={{stopColor:"#1e3d2a", stopOpacity:0.7}} />
            </linearGradient>
            <linearGradient id="qrGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#22c55e", stopOpacity:0.8}} />
              <stop offset="100%" style={{stopColor:"#16a34a", stopOpacity:0.6}} />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <circle cx="32" cy="32" r="30" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2"/>
          
          <path 
            d="M20 25 C20 18, 26 15, 32 18 C38 21, 42 28, 40 35 C38 42, 32 45, 26 42 C20 39, 16 32, 20 25 Z" 
            fill="url(#leafGradient)" 
            stroke="#2d5a3d" 
            strokeWidth="1.5"
          />
          
          <path 
            d="M24 25 L28 32 M28 22 L32 28 M32 19 L36 25" 
            stroke="#2d5a3d" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            opacity="0.8"
          />
          
          <g transform="translate(20, 45)">
            <ellipse cx="4" cy="4" rx="3" ry="2" fill="none" stroke="url(#chainGradient)" strokeWidth="1.5"/>
            <ellipse cx="4" cy="4" rx="2" ry="1.2" fill="none" stroke="url(#chainGradient)" strokeWidth="1"/>
            <ellipse cx="10" cy="4" rx="3" ry="2" fill="none" stroke="url(#chainGradient)" strokeWidth="1.5"/>
            <ellipse cx="10" cy="4" rx="2" ry="1.2" fill="none" stroke="url(#chainGradient)" strokeWidth="1"/>
            <ellipse cx="16" cy="4" rx="3" ry="2" fill="none" stroke="url(#chainGradient)" strokeWidth="1.5"/>
            <ellipse cx="16" cy="4" rx="2" ry="1.2" fill="none" stroke="url(#chainGradient)" strokeWidth="1"/>
            <line x1="7" y1="4" x2="7" y2="4" stroke="url(#chainGradient)" strokeWidth="1.5"/>
            <line x1="13" y1="4" x2="13" y2="4" stroke="url(#chainGradient)" strokeWidth="1.5"/>
          </g>
          
          <g transform="translate(20, 20)">
            <rect x="0" y="0" width="2" height="2" fill="url(#qrGradient)"/>
            <rect x="3" y="0" width="1" height="1" fill="url(#qrGradient)"/>
            <rect x="5" y="0" width="2" height="2" fill="url(#qrGradient)"/>
            <rect x="0" y="3" width="1" height="1" fill="url(#qrGradient)"/>
            <rect x="2" y="3" width="1" height="1" fill="url(#qrGradient)"/>
            <rect x="4" y="3" width="1" height="1" fill="url(#qrGradient)"/>
            <rect x="6" y="3" width="1" height="1" fill="url(#qrGradient)"/>
            <rect x="0" y="5" width="2" height="2" fill="url(#qrGradient)"/>
            <rect x="3" y="5" width="1" height="1" fill="url(#qrGradient)"/>
            <rect x="5" y="5" width="2" height="2" fill="url(#qrGradient)"/>
            <rect x="0" y="0" width="2" height="2" fill="none" stroke="url(#qrGradient)" strokeWidth="0.5"/>
            <rect x="5" y="0" width="2" height="2" fill="none" stroke="url(#qrGradient)" strokeWidth="0.5"/>
            <rect x="0" y="5" width="2" height="2" fill="none" stroke="url(#qrGradient)" strokeWidth="0.5"/>
          </g>
          
          {animated && (
            <line 
              x1="20" 
              y1="25" 
              x2="28" 
              y2="25" 
              stroke="#22c55e" 
              strokeWidth="1" 
              opacity="0.7" 
              filter="url(#glow)"
            >
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
            </line>
          )}
        </svg>
      </div>
    )
  }

  if (variant === "text") {
    return (
      <span className={cn("font-bold text-primary", textSizes[size], className)}>
        GroChain
      </span>
    )
  }

  // Full logo variant
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className={cn("flex items-center justify-center", sizeClasses[size])}>
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 64 64" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          <defs>
            <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#2d5a3d", stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:"#1e3d2a", stopOpacity:1}} />
            </linearGradient>
            <linearGradient id="chainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#2d5a3d", stopOpacity:0.9}} />
              <stop offset="100%" style={{stopColor:"#1e3d2a", stopOpacity:0.7}} />
            </linearGradient>
            <linearGradient id="qrGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#22c55e", stopOpacity:0.8}} />
              <stop offset="100%" style={{stopColor:"#16a34a", stopOpacity:0.6}} />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <circle cx="32" cy="32" r="30" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2"/>
          
          <path 
            d="M20 25 C20 18, 26 15, 32 18 C38 21, 42 28, 40 35 C38 42, 32 45, 26 42 C20 39, 16 32, 20 25 Z" 
            fill="url(#leafGradient)" 
            stroke="#2d5a3d" 
            strokeWidth="1.5"
          />
          
          <path 
            d="M24 25 L28 32 M28 22 L32 28 M32 19 L36 25" 
            stroke="#2d5a3d" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            opacity="0.8"
          />
          
          <g transform="translate(20, 45)">
            <ellipse cx="4" cy="4" rx="3" ry="2" fill="none" stroke="url(#chainGradient)" strokeWidth="1.5"/>
            <ellipse cx="4" cy="4" rx="2" ry="1.2" fill="none" stroke="url(#chainGradient)" strokeWidth="1"/>
            <ellipse cx="10" cy="4" rx="3" ry="2" fill="none" stroke="url(#chainGradient)" strokeWidth="1.5"/>
            <ellipse cx="10" cy="4" rx="2" ry="1.2" fill="none" stroke="url(#chainGradient)" strokeWidth="1"/>
            <ellipse cx="16" cy="4" rx="3" ry="2" fill="none" stroke="url(#chainGradient)" strokeWidth="1.5"/>
            <ellipse cx="16" cy="4" rx="2" ry="1.2" fill="none" stroke="url(#chainGradient)" strokeWidth="1"/>
            <line x1="7" y1="4" x2="7" y2="4" stroke="url(#chainGradient)" strokeWidth="1.5"/>
            <line x1="13" y1="4" x2="13" y2="4" stroke="url(#chainGradient)" strokeWidth="1.5"/>
          </g>
          
          <g transform="translate(20, 20)">
            <rect x="0" y="0" width="2" height="2" fill="url(#qrGradient)"/>
            <rect x="3" y="0" width="1" height="1" fill="url(#qrGradient)"/>
            <rect x="5" y="0" width="2" height="2" fill="url(#qrGradient)"/>
            <rect x="0" y="3" width="1" height="1" fill="url(#qrGradient)"/>
            <rect x="2" y="3" width="1" height="1" fill="url(#qrGradient)"/>
            <rect x="4" y="3" width="1" height="1" fill="url(#qrGradient)"/>
            <rect x="6" y="3" width="1" height="1" fill="url(#qrGradient)"/>
            <rect x="0" y="5" width="2" height="2" fill="url(#qrGradient)"/>
            <rect x="3" y="5" width="1" height="1" fill="url(#qrGradient)"/>
            <rect x="5" y="5" width="2" height="2" fill="url(#qrGradient)"/>
            <rect x="0" y="0" width="2" height="2" fill="none" stroke="url(#qrGradient)" strokeWidth="0.5"/>
            <rect x="5" y="0" width="2" height="2" fill="none" stroke="url(#qrGradient)" strokeWidth="0.5"/>
            <rect x="0" y="5" width="2" height="2" fill="none" stroke="url(#qrGradient)" strokeWidth="0.5"/>
          </g>
          
          {animated && (
            <line 
              x1="20" 
              y1="25" 
              x2="28" 
              y2="25" 
              stroke="#22c55e" 
              strokeWidth="1" 
              opacity="0.7" 
              filter="url(#glow)"
            >
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
            </line>
          )}
        </svg>
      </div>
      <span className={cn("font-bold text-primary", textSizes[size])}>
        GroChain
      </span>
    </div>
  )
}
