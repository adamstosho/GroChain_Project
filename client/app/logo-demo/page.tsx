"use client"

import { GroChainLogo } from "@/components/ui/grochain-logo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LogoDemoPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">GroChain Logo Showcase</h1>
          <p className="text-lg text-muted-foreground">
            Modern, professional logo combining agriculture and technology elements
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Full Logo Variants */}
          <Card>
            <CardHeader>
              <CardTitle>Full Logo</CardTitle>
              <CardDescription>Complete logo with icon and text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                <GroChainLogo variant="full" size="sm" />
              </div>
              <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                <GroChainLogo variant="full" size="md" />
              </div>
              <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                <GroChainLogo variant="full" size="lg" />
              </div>
              <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                <GroChainLogo variant="full" size="xl" />
              </div>
            </CardContent>
          </Card>

          {/* Icon Only Variants */}
          <Card>
            <CardHeader>
              <CardTitle>Icon Only</CardTitle>
              <CardDescription>Logo icon without text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                <GroChainLogo variant="icon" size="sm" />
              </div>
              <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                <GroChainLogo variant="icon" size="md" />
              </div>
              <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                <GroChainLogo variant="icon" size="lg" />
              </div>
              <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                <GroChainLogo variant="icon" size="xl" />
              </div>
            </CardContent>
          </Card>

          {/* Text Only Variants */}
          <Card>
            <CardHeader>
              <CardTitle>Text Only</CardTitle>
              <CardDescription>Company name without icon</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                <GroChainLogo variant="text" size="sm" />
              </div>
              <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                <GroChainLogo variant="text" size="md" />
              </div>
              <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                <GroChainLogo variant="text" size="lg" />
              </div>
              <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                <GroChainLogo variant="text" size="xl" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Animated Version */}
        <Card>
          <CardHeader>
            <CardTitle>Animated Logo</CardTitle>
            <CardDescription>Logo with growth and scan effects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-8 bg-muted/50 rounded-lg">
              <GroChainLogo variant="full" size="lg" animated={true} />
            </div>
          </CardContent>
        </Card>

        {/* Design Elements */}
        <Card>
          <CardHeader>
            <CardTitle>Design Elements</CardTitle>
            <CardDescription>Key visual components of the logo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{backgroundColor: '#2d5a3d'}}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M16 8 C16 4, 20 2, 24 4 C28 6, 30 12, 28 18 C26 24, 20 26, 16 24 C12 22, 10 16, 16 8 Z" fill="white"/>
                    <path d="M18 12 L20 16 M20 10 L22 14 M22 8 L24 12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="font-semibold">Organic Leaf</h3>
                <p className="text-sm text-muted-foreground">Represents agriculture and growth</p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{backgroundColor: '#1e3d2a'}}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <ellipse cx="8" cy="8" rx="4" ry="3" fill="none" stroke="white" strokeWidth="2"/>
                    <ellipse cx="16" cy="8" rx="4" ry="3" fill="none" stroke="white" strokeWidth="2"/>
                    <ellipse cx="24" cy="8" rx="4" ry="3" fill="none" stroke="white" strokeWidth="2"/>
                    <line x1="12" y1="8" x2="12" y2="8" stroke="white" strokeWidth="2"/>
                    <line x1="20" y1="8" x2="20" y2="8" stroke="white" strokeWidth="2"/>
                  </svg>
                </div>
                <h3 className="font-semibold">Chain Links</h3>
                <p className="text-sm text-muted-foreground">Symbolizes blockchain and supply chain</p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{backgroundColor: '#22c55e'}}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect x="4" y="4" width="3" height="3" fill="white"/>
                    <rect x="8" y="4" width="2" height="2" fill="white"/>
                    <rect x="11" y="4" width="3" height="3" fill="white"/>
                    <rect x="4" y="8" width="2" height="2" fill="white"/>
                    <rect x="7" y="8" width="1" height="1" fill="white"/>
                    <rect x="9" y="8" width="2" height="2" fill="white"/>
                    <rect x="12" y="8" width="2" height="2" fill="white"/>
                    <rect x="4" y="11" width="3" height="3" fill="white"/>
                    <rect x="8" y="11" width="2" height="2" fill="white"/>
                    <rect x="11" y="11" width="3" height="3" fill="white"/>
                  </svg>
                </div>
                <h3 className="font-semibold">QR Code</h3>
                <p className="text-sm text-muted-foreground">Represents verification and traceability</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardDescription>Brand colors used in the logo - now using design system colors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-lg" style={{backgroundColor: '#2d5a3d'}}></div>
                <h4 className="font-medium">Primary Green</h4>
                <p className="text-sm text-muted-foreground">#2d5a3d</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-lg" style={{backgroundColor: '#1e3d2a'}}></div>
                <h4 className="font-medium">Dark Green</h4>
                <p className="text-sm text-muted-foreground">#1e3d2a</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-lg" style={{backgroundColor: '#22c55e'}}></div>
                <h4 className="font-medium">Success Green</h4>
                <p className="text-sm text-muted-foreground">#22c55e</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-lg" style={{backgroundColor: '#16a34a'}}></div>
                <h4 className="font-medium">Success Dark</h4>
                <p className="text-sm text-muted-foreground">#16a34a</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
