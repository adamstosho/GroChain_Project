"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { 
  ArrowLeft, 
  Target, 
  Plus, 
  TrendingUp, 
  Calendar, 
  Banknote, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Edit,
  Trash2,
  PiggyBank,
  Building,
  Car,
  GraduationCap,
  Shield,
  Zap
} from "lucide-react"
import Link from "next/link"

interface FinancialGoal {
  _id: string
  title: string
  description: string
  type: string
  targetAmount: number
  currentAmount: number
  currency: string
  startDate: string
  targetDate: string
  priority: string
  status: string
  progress: number
  category: string
}

interface GoalFormData {
  title: string
  description: string
  type: string
  targetAmount: number
  startDate: string
  targetDate: string
  priority: string
  category: string
}

const goalTypes = [
  "savings",
  "investment", 
  "debt_reduction",
  "business_expansion",
  "equipment_purchase",
  "education",
  "emergency_fund"
]

const priorities = ["low", "medium", "high", "critical"]
const categories = ["short_term", "medium_term", "long_term"]

const getGoalTypeIcon = (type: string) => {
  switch (type) {
    case 'savings': return <PiggyBank className="h-5 w-5" />
    case 'investment': return <TrendingUp className="h-5 w-5" />
    case 'debt_reduction': return <Banknote className="h-5 w-5" />
    case 'business_expansion': return <Building className="h-5 w-5" />
    case 'equipment_purchase': return <Zap className="h-5 w-5" />
    case 'education': return <GraduationCap className="h-5 w-5" />
    case 'emergency_fund': return <Shield className="h-5 w-5" />
    default: return <Target className="h-5 w-5" />
  }
}

const getGoalTypeLabel = (type: string) => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'bg-red-50 text-red-700 border-red-200'
    case 'high': return 'bg-orange-50 text-orange-700 border-orange-200'
    case 'medium': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'low': return 'bg-gray-50 text-gray-700 border-gray-200'
    default: return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'paused': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'completed': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'cancelled': return 'bg-red-50 text-red-700 border-red-200'
    default: return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'short_term': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'medium_term': return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'long_term': return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    default: return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

export default function FinancialGoalsPage() {
  const [goals, setGoals] = useState<FinancialGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingGoal, setDeletingGoal] = useState<FinancialGoal | null>(null)
  const [stats, setStats] = useState({
    totalGoals: 0,
    activeGoals: 0,
    completedGoals: 0,
    totalTarget: 0,
    totalCurrent: 0,
    averageProgress: 0
  })
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    type: '',
    targetAmount: 0,
    startDate: '',
    targetDate: '',
    priority: 'medium',
    category: 'medium_term'
  })
  
  const { toast } = useToast()

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      setLoading(true)

      // Fetch real data from backend API
      const goalsResponse = await apiService.getFinancialGoals()

      if (goalsResponse.status === 'success' && goalsResponse.data) {
        const goalsData = (goalsResponse.data as any).goals || []

        // Transform backend data to match frontend interface
        const transformedGoals: FinancialGoal[] = goalsData.map((goal: any) => ({
          _id: goal._id || goal.id,
          title: goal.title,
          description: goal.description || '',
          type: goal.type || 'savings',
          targetAmount: goal.targetAmount || 0,
          currentAmount: goal.currentAmount || 0,
          currency: goal.currency || 'NGN',
          startDate: goal.startDate || new Date().toISOString().split('T')[0],
          targetDate: goal.targetDate || new Date().toISOString().split('T')[0],
          priority: goal.priority || 'medium',
          status: goal.status || 'active',
          progress: goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0,
          category: goal.category || (goal.targetDate ?
            (new Date(goal.targetDate).getTime() - new Date().getTime() > 365 * 24 * 60 * 60 * 1000 ? 'long_term' :
             new Date(goal.targetDate).getTime() - new Date().getTime() > 90 * 24 * 60 * 60 * 1000 ? 'medium_term' : 'short_term')
            : 'medium_term')
        }))

        setGoals(transformedGoals)

        // Calculate statistics
        const totalGoals = transformedGoals.length
        const activeGoals = transformedGoals.filter(goal => goal.status === 'active').length
        const completedGoals = transformedGoals.filter(goal => goal.status === 'completed').length
        const totalTarget = transformedGoals.reduce((sum, goal) => sum + goal.targetAmount, 0)
        const totalCurrent = transformedGoals.reduce((sum, goal) => sum + goal.currentAmount, 0)
        const averageProgress = totalGoals > 0 ? Math.round(transformedGoals.reduce((sum, goal) => sum + goal.progress, 0) / totalGoals) : 0

        setStats({
          totalGoals,
          activeGoals,
          completedGoals,
          totalTarget,
          totalCurrent,
          averageProgress
        })
      } else {
        throw new Error('Failed to fetch financial goals')
      }
    } catch (error) {
      console.error("Failed to fetch goals:", error)
      toast({
        title: "Error",
        description: "Failed to load financial goals. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.type || !formData.targetAmount || !formData.targetDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    try {
      // Mock creation - replace with actual API call
      const newGoal: FinancialGoal = {
        _id: Date.now().toString(),
        ...formData,
        currentAmount: 0,
        currency: 'NGN',
        startDate: formData.startDate || new Date().toISOString().split('T')[0],
        status: 'active',
        progress: 0
      }
      
      setGoals(prev => [...prev, newGoal])
      setShowCreateDialog(false)
      resetForm()
      
      toast({
        title: "Goal Created Successfully! 🎯",
        description: "Your financial goal has been set and is now being tracked.",
        variant: "default"
      })
    } catch (error) {
      console.error("Failed to create goal:", error)
      toast({
        title: "Creation Failed",
        description: "Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingGoal || !formData.title || !formData.type || !formData.targetAmount || !formData.targetDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    try {
      // Mock update - replace with actual API call
      const updatedGoal: FinancialGoal = {
        ...editingGoal,
        ...formData
      }
      
      setGoals(prev => prev.map(goal => 
        goal._id === editingGoal._id ? updatedGoal : goal
      ))
      
      setEditingGoal(null)
      resetForm()
      
      toast({
        title: "Goal Updated Successfully! ✨",
        description: "Your financial goal has been updated.",
        variant: "default"
      })
    } catch (error) {
      console.error("Failed to update goal:", error)
      toast({
        title: "Update Failed",
        description: "Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteGoal = async () => {
    if (!deletingGoal) return
    
    try {
      setLoading(true)
      // Mock deletion - replace with actual API call
      setGoals(prev => prev.filter(goal => goal._id !== deletingGoal._id))
      setShowDeleteDialog(false)
      setDeletingGoal(null)
      
      toast({
        title: "Goal Deleted",
        description: "Your financial goal has been removed.",
        variant: "default"
      })
    } catch (error) {
      console.error("Failed to delete goal:", error)
      toast({
        title: "Deletion Failed",
        description: "Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: '',
      targetAmount: 0,
      startDate: '',
      targetDate: '',
      priority: 'medium',
      category: 'medium_term'
    })
  }

  const openEditDialog = (goal: FinancialGoal) => {
    setEditingGoal(goal)
    setFormData({
      title: goal.title,
      description: goal.description,
      type: goal.type,
      targetAmount: goal.targetAmount,
      startDate: goal.startDate,
      targetDate: goal.targetDate,
      priority: goal.priority,
      category: goal.category
    })
  }

  const openDeleteDialog = (goal: FinancialGoal) => {
    setDeletingGoal(goal)
    setShowDeleteDialog(true)
  }

  const getDaysRemaining = (targetDate: string) => {
    const today = new Date()
    const target = new Date(targetDate)
    const diffTime = target.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-emerald-500'
    if (progress >= 60) return 'bg-blue-500'
    if (progress >= 40) return 'bg-amber-500'
    if (progress >= 20) return 'bg-orange-500'
    return 'bg-red-500'
  }

  if (loading) {
    return (
      <DashboardLayout pageTitle="Financial Goals">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse border border-gray-200">
                <CardHeader className="pb-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Financial Goals">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="text-gray-600 hover:text-gray-900">
                <Link href="/dashboard/financial" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Financial Services
                </Link>
              </Button>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Financial Goals</h1>
            <p className="text-gray-600">
              Set, track, and achieve your financial objectives
            </p>
          </div>
          
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Set New Goal
          </Button>
        </div>

        {/* Goals Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                Total Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{goals.length}</div>
              <p className="text-xs text-gray-500">Active objectives</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Total Target
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                ₦{(goals.reduce((sum, goal) => sum + goal.targetAmount, 0) / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-gray-500">Combined target</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Banknote className="h-4 w-4 text-green-500" />
                Total Saved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                ₦{(goals.reduce((sum, goal) => sum + goal.currentAmount, 0) / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-gray-500">Current progress</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-purple-500" />
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {goals.length > 0 ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length) : 0}%
              </div>
              <p className="text-xs text-gray-500">Average progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Goals List */}
        {goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => (
              <Card key={goal._id} className="border border-gray-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getGoalTypeIcon(goal.type)}
                      <div>
                        <CardTitle className="text-base font-medium">{goal.title}</CardTitle>
                        <CardDescription className="text-sm">{getGoalTypeLabel(goal.type)}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(goal)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openDeleteDialog(goal)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600 line-clamp-2">{goal.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress:</span>
                      <span className="font-medium">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Current:</span>
                      <span className="font-medium">₦{goal.currentAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Target:</span>
                      <span className="font-medium">₦{goal.targetAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge className={getPriorityColor(goal.priority)}>
                      {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)}
                    </Badge>
                    <Badge className={getStatusColor(goal.status)}>
                      {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                    </Badge>
                    <Badge className={getCategoryColor(goal.category)}>
                      {goal.category.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Due: {new Date(goal.targetDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{getDaysRemaining(goal.targetDate)} days left</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12 border border-gray-200">
            <div className="text-gray-400 mb-4">
              <Target className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Financial Goals Set</h3>
            <p className="text-gray-600 mb-4">
              Start planning your financial future by setting clear, achievable goals.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Target className="h-4 w-4 mr-2" />
              Create Your First Goal
            </Button>
          </Card>
        )}

        {/* Create/Edit Goal Dialog */}
        <Dialog open={showCreateDialog || !!editingGoal} onOpenChange={() => {
          setShowCreateDialog(false)
          setEditingGoal(null)
          resetForm()
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? "Edit Financial Goal" : "Create New Financial Goal"}
              </DialogTitle>
              <DialogDescription>
                {editingGoal 
                  ? "Update your financial goal details and objectives."
                  : "Set a new financial goal with clear targets and timeline."
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Goal Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Emergency Fund"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Goal Type *</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select goal type" />
                    </SelectTrigger>
                    <SelectContent>
                      {goalTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {getGoalTypeLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your goal and why it's important..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetAmount">Target Amount (NGN) *</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: Number(e.target.value) }))}
                    placeholder="e.g., 500000"
                    min="1000"
                    step="1000"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="targetDate">Target Date *</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Time Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateDialog(false)
                    setEditingGoal(null)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingGoal ? "Update Goal" : "Create Goal"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Financial Goal</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deletingGoal?.title}"? This action cannot be undone and will remove all progress tracking for this goal.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteGoal}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Goal"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
