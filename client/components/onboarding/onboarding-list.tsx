"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  MessageSquare, 
  Calendar,
  MapPin,
  Leaf,
  Scale,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  TrendingUp,
  Users
} from "lucide-react"
import { useOnboarding } from "@/hooks/use-onboarding"

export function OnboardingList() {
  const { onboardings, filters, setFilters } = useOnboarding()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [stageFilter, setStageFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case "in_progress":
        return <Badge variant="default"><TrendingUp className="w-3 h-3 mr-1" />In Progress</Badge>
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      case "on_hold":
        return <Badge variant="outline"><Pause className="w-3 h-3 mr-1" />On Hold</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>
      case "medium":
        return <Badge variant="default">Medium</Badge>
      case "low":
        return <Badge variant="secondary">Low</Badge>
      default:
        return <Badge variant="secondary">{priority}</Badge>
    }
  }

  const filteredOnboardings = onboardings.filter(onboarding => {
    const matchesSearch = searchTerm === "" || 
      onboarding.farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      onboarding.farmer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      onboarding.farmer.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || onboarding.status === statusFilter
    const matchesStage = stageFilter === "all" || onboarding.stage === stageFilter
    const matchesPriority = priorityFilter === "all" || onboarding.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesStage && matchesPriority
  })

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
          <CardDescription>Find specific onboardings or filter by criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search farmers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="registration">Registration</SelectItem>
                <SelectItem value="documentation">Documentation</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="verification">Verification</SelectItem>
                <SelectItem value="activation">Activation</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Onboardings List */}
      <Card>
        <CardHeader>
          <CardTitle>All Onboardings ({filteredOnboardings.length})</CardTitle>
          <CardDescription>Manage and track farmer onboarding progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOnboardings.map((onboarding) => (
              <Card key={onboarding._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Farmer Avatar */}
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={(onboarding.farmer as any).avatar} />
                        <AvatarFallback>
                          {onboarding.farmer.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Farmer Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{onboarding.farmer.name}</h3>
                            <p className="text-sm text-muted-foreground">{onboarding.farmer.email}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(onboarding.status)}
                            {getPriorityBadge(onboarding.priority)}
                          </div>
                        </div>
                        
                        {/* Key Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {typeof onboarding.farmer.location === 'string' ? onboarding.farmer.location : `${(onboarding.farmer.location as any)?.city || 'Unknown'}, ${(onboarding.farmer.location as any)?.state || 'Unknown State'}`}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Leaf className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {onboarding.farmer.primaryCrops.slice(0, 2).join(', ')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Scale className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {onboarding.farmer.farmSize} {onboarding.farmer.farmSizeUnit}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(onboarding.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        {/* Training Progress */}
                        {onboarding.training && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Training Progress</span>
                              <span className="text-sm text-muted-foreground">
                                {onboarding.training.progress}% Complete
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${onboarding.training.progress}%` }}
                              />
                            </div>
                            {onboarding.training.currentModule && (
                              <p className="text-xs text-muted-foreground">
                                Current: {onboarding.training.currentModule}
                              </p>
                            )}
                          </div>
                        )}
                        
                        {/* Notes */}
                        {onboarding.notes.length > 0 && (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <strong>Latest Note:</strong> {onboarding.notes[onboarding.notes.length - 1]}
                            </p>
                          </div>
                        )}
                        
                        {/* Next Follow-up */}
                        {onboarding.nextFollowUp && (
                          <div className="bg-yellow-50 p-3 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              <strong>Next Follow-up:</strong> {new Date(onboarding.nextFollowUp).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                      <Button variant="outline" size="sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredOnboardings.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No onboardings found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
