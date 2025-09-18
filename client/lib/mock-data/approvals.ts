import { HarvestApproval, ApprovalStats } from "../types/approvals"

export const mockApprovals: HarvestApproval[] = [
  {
    _id: "1",
    farmer: {
      _id: "farmer1",
      name: "John Doe",
      email: "john@farmer.com",
      phone: "+2348012345678",
      location: "Lagos",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=John Doe"
    },
    harvest: {
      _id: "harvest1",
      cropType: "Tomatoes",
      quantity: 150,
      unit: "kg",
      harvestDate: new Date("2024-01-20"),
      qualityScore: 8.5,
      photos: ["https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400"],
      description: "Fresh red tomatoes, harvested this morning"
    },
    status: "pending",
    submittedAt: new Date("2024-01-20T10:00:00Z"),
    priority: "high",
    estimatedValue: 45000,
    location: "Lagos"
  },
  {
    _id: "2",
    farmer: {
      _id: "farmer2",
      name: "Jane Smith",
      email: "jane@farmer.com",
      phone: "+2348012345679",
      location: "Abuja",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Jane Smith"
    },
    harvest: {
      _id: "harvest2",
      cropType: "Cassava",
      quantity: 200,
      unit: "kg",
      harvestDate: new Date("2024-01-19"),
      qualityScore: 7.8,
      photos: ["https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400"],
      description: "Fresh cassava tubers, good size and quality"
    },
    status: "approved",
    submittedAt: new Date("2024-01-19T14:30:00Z"),
    reviewedAt: new Date("2024-01-19T16:00:00Z"),
    reviewedBy: "partner_user",
    qualityAssessment: {
      overallScore: 7.8,
      appearance: 8,
      freshness: 8,
      size: 7,
      cleanliness: 8,
      notes: "Good quality cassava, meets standards"
    },
    approvalNotes: "Approved for marketplace listing",
    priority: "medium",
    estimatedValue: 30000,
    location: "Abuja"
  },
  {
    _id: "3",
    farmer: {
      _id: "farmer3",
      name: "Mike Johnson",
      email: "mike@farmer.com",
      phone: "+2348012345680",
      location: "Kano",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Mike Johnson"
    },
    harvest: {
      _id: "harvest3",
      cropType: "Maize",
      quantity: 300,
      unit: "kg",
      harvestDate: new Date("2024-01-18"),
      qualityScore: 6.2,
      photos: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400"],
      description: "Maize grains, some moisture content issues"
    },
    status: "rejected",
    submittedAt: new Date("2024-01-18T09:15:00Z"),
    reviewedAt: new Date("2024-01-18T11:00:00Z"),
    reviewedBy: "partner_user",
    qualityAssessment: {
      overallScore: 6.2,
      appearance: 6,
      freshness: 5,
      size: 7,
      cleanliness: 7,
      notes: "Moisture content too high, needs drying"
    },
    rejectionReason: "Moisture content exceeds acceptable levels. Please dry properly before resubmission.",
    priority: "low",
    estimatedValue: 45000,
    location: "Kano"
  },
  {
    _id: "4",
    farmer: {
      _id: "farmer4",
      name: "Sarah Wilson",
      email: "sarah@farmer.com",
      phone: "+2348012345681",
      location: "Ondo",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Sarah Wilson"
    },
    harvest: {
      _id: "harvest4",
      cropType: "Rice",
      quantity: 100,
      unit: "kg",
      harvestDate: new Date("2024-01-17"),
      qualityScore: 9.1,
      photos: ["https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400"],
      description: "Premium quality rice, excellent grain size and cleanliness"
    },
    status: "pending",
    submittedAt: new Date("2024-01-17T15:45:00Z"),
    priority: "medium",
    estimatedValue: 35000,
    location: "Ondo"
  },
  {
    _id: "5",
    farmer: {
      _id: "farmer5",
      name: "David Brown",
      email: "david@farmer.com",
      phone: "+2348012345682",
      location: "Kaduna",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=David Brown"
    },
    harvest: {
      _id: "harvest5",
      cropType: "Yam",
      quantity: 250,
      unit: "kg",
      harvestDate: new Date("2024-01-16"),
      qualityScore: 8.7,
      photos: ["https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400"],
      description: "Fresh yam tubers, good size and firm texture"
    },
    status: "under_review",
    submittedAt: new Date("2024-01-16T12:20:00Z"),
    priority: "high",
    estimatedValue: 50000,
    location: "Kaduna"
  }
]

export const mockApprovalStats: ApprovalStats = {
  total: 5,
  pending: 2,
  approved: 1,
  rejected: 1,
  underReview: 1,
  averageQualityScore: 8.1,
  totalValue: 30000,
  weeklyTrend: 12.5
}
