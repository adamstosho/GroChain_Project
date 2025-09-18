"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Star, Camera, Upload, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { cn } from "@/lib/utils"

interface ReviewFormProps {
  listingId: string
  listingName: string
  farmerName: string
  orderId?: string
  onReviewSubmitted?: () => void
  onCancel?: () => void
  className?: string
}

export function ReviewForm({
  listingId,
  listingName,
  farmerName,
  orderId,
  onReviewSubmitted,
  onCancel,
  className
}: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const ratingLabels = {
    1: "Poor",
    2: "Fair", 
    3: "Good",
    4: "Very Good",
    5: "Excellent"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting your review.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      await apiService.createReview(listingId, {
        rating,
        comment: comment.trim(),
        images,
        orderId
      })

      toast({
        title: "Review Submitted!",
        description: "Thank you for your feedback. Your review has been submitted successfully.",
      })

      // Reset form
      setRating(0)
      setComment("")
      setImages([])
      
      onReviewSubmitted?.()
    } catch (error: any) {
      console.error("Error submitting review:", error)
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit review. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      // Convert files to base64 (simplified - in production, upload to cloud storage)
      Array.from(files).forEach(file => {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          toast({
            title: "File Too Large",
            description: "Please select images smaller than 5MB.",
            variant: "destructive"
          })
          return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
          if (event.target?.result) {
            setImages(prev => [...prev, event.target!.result as string])
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Write a Review
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          <p><strong>Product:</strong> {listingName}</p>
          <p><strong>Farmer:</strong> {farmerName}</p>
          {orderId && (
            <Badge variant="outline" className="mt-1">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified Purchase
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Section */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Overall Rating *</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 rounded"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 hover:text-yellow-300"
                    )}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-3 text-sm font-medium text-muted-foreground">
                  {ratingLabels[rating as keyof typeof ratingLabels]}
                </span>
              )}
            </div>
            {rating === 0 && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Please select a rating
              </p>
            )}
          </div>

          {/* Comment Section */}
          <div className="space-y-3">
            <Label htmlFor="comment" className="text-base font-medium">
              Share Your Experience
            </Label>
            <Textarea
              id="comment"
              placeholder="Tell other buyers about your experience with this product. What did you like? What could be improved?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={1000}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Optional - Help other buyers make informed decisions</span>
              <span>{comment.length}/1000</span>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Add Photos (Optional)</Label>
            <div className="space-y-3">
              {/* Upload Button */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={images.length >= 5}
                />
                <div className={cn(
                  "flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg transition-colors",
                  images.length >= 5 
                    ? "border-gray-200 bg-gray-50 cursor-not-allowed" 
                    : "border-gray-300 hover:border-gray-400 hover:bg-gray-50 cursor-pointer"
                )}>
                  <Camera className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {images.length >= 5 ? "Maximum 5 photos" : "Click to add photos"}
                  </span>
                </div>
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Review image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Add photos to help other buyers see the product quality
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting Review...
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}


