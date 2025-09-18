import { FarmerOnboarding, OnboardingStats, OnboardingTemplate, OnboardingWorkflow } from '../types/onboarding'

export const mockOnboardings: FarmerOnboarding[] = [
  {
    _id: "1",
    farmer: {
      name: "John Doe",
      email: "john@farmer.com",
      phone: "+2348012345678",
      location: "Lagos",
      state: "Lagos",
      lga: "Ikeja",
      village: "Allen",
      coordinates: {
        latitude: 6.6018,
        longitude: 3.3515
      },
      farmSize: 2.5,
      farmSizeUnit: "hectares",
      primaryCrops: ["Tomatoes", "Cassava", "Maize"],
      farmingExperience: "intermediate",
      educationLevel: "secondary",
      householdSize: 6,
      annualIncome: 450000,
      incomeSource: "farming"
    },
    documents: {
      idCard: "https://example.com/id1.jpg",
      landDocument: "https://example.com/land1.pdf",
      passportPhoto: "https://example.com/photo1.jpg"
    },
    training: {
      completedModules: ["Basic Farming", "Soil Management"],
      currentModule: "Crop Protection",
      progress: 65,
      certificates: ["Basic Farming Certificate"],
      lastTrainingDate: new Date("2024-01-20")
    },
    status: "in_progress",
    stage: "training",
    assignedPartner: "partner1",
    assignedAgent: "agent1",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    notes: ["Farmer shows good potential", "Needs help with irrigation"],
    nextFollowUp: new Date("2024-01-25"),
    priority: "high",
    estimatedCompletionDate: new Date("2024-02-15")
  },
  {
    _id: "2",
    farmer: {
      name: "Jane Smith",
      email: "jane@farmer.com",
      phone: "+2348012345679",
      location: "Abuja",
      state: "FCT",
      lga: "Gwagwalada",
      village: "Kuje",
      coordinates: {
        latitude: 8.9806,
        longitude: 7.3981
      },
      farmSize: 1.8,
      farmSizeUnit: "hectares",
      primaryCrops: ["Rice", "Yam"],
      farmingExperience: "beginner",
      educationLevel: "primary",
      householdSize: 4,
      annualIncome: 320000,
      incomeSource: "mixed"
    },
    documents: {
      idCard: "https://example.com/id2.jpg",
      passportPhoto: "https://example.com/photo2.jpg"
    },
    training: {
      completedModules: ["Basic Farming"],
      currentModule: "Soil Management",
      progress: 35,
      certificates: [],
      lastTrainingDate: new Date("2024-01-18")
    },
    status: "in_progress",
    stage: "training",
    assignedPartner: "partner1",
    assignedAgent: "agent2",
    createdAt: new Date("2024-01-16"),
    updatedAt: new Date("2024-01-18"),
    notes: ["First-time farmer", "Very enthusiastic"],
    nextFollowUp: new Date("2024-01-23"),
    priority: "medium",
    estimatedCompletionDate: new Date("2024-02-20")
  },
  {
    _id: "3",
    farmer: {
      name: "Mike Johnson",
      email: "mike@farmer.com",
      phone: "+2348012345680",
      location: "Kano",
      state: "Kano",
      lga: "Ungogo",
      village: "Dawakin",
      coordinates: {
        latitude: 11.9914,
        longitude: 8.5313
      },
      farmSize: 4.2,
      farmSizeUnit: "hectares",
      primaryCrops: ["Maize", "Sorghum", "Groundnut"],
      farmingExperience: "expert",
      educationLevel: "tertiary",
      householdSize: 8,
      annualIncome: 780000,
      incomeSource: "farming"
    },
    documents: {
      idCard: "https://example.com/id3.jpg",
      landDocument: "https://example.com/land3.pdf",
      bankStatement: "https://example.com/bank3.pdf",
      passportPhoto: "https://example.com/photo3.jpg"
    },
    training: {
      completedModules: ["Basic Farming", "Soil Management", "Crop Protection", "Market Access"],
      currentModule: "Advanced Techniques",
      progress: 90,
      certificates: ["Basic Farming Certificate", "Soil Management Certificate", "Crop Protection Certificate"],
      lastTrainingDate: new Date("2024-01-19")
    },
    status: "in_progress",
    stage: "verification",
    assignedPartner: "partner1",
    assignedAgent: "agent1",
    createdAt: new Date("2024-01-14"),
    updatedAt: new Date("2024-01-19"),
    notes: ["Experienced farmer", "Ready for marketplace access"],
    nextFollowUp: new Date("2024-01-22"),
    priority: "high",
    estimatedCompletionDate: new Date("2024-01-30")
  },
  {
    _id: "4",
    farmer: {
      name: "Sarah Wilson",
      email: "sarah@farmer.com",
      phone: "+2348012345681",
      location: "Ondo",
      state: "Ondo",
      lga: "Akure South",
      village: "Alagbaka",
      coordinates: {
        latitude: 7.2574,
        longitude: 5.2058
      },
      farmSize: 1.5,
      farmSizeUnit: "hectares",
      primaryCrops: ["Cocoa", "Plantain"],
      farmingExperience: "intermediate",
      educationLevel: "secondary",
      householdSize: 5,
      annualIncome: 520000,
      incomeSource: "farming"
    },
    documents: {
      idCard: "https://example.com/id4.jpg",
      landDocument: "https://example.com/land4.pdf",
      passportPhoto: "https://example.com/photo4.jpg"
    },
    training: {
      completedModules: ["Basic Farming", "Soil Management"],
      currentModule: "Crop Protection",
      progress: 60,
      certificates: ["Basic Farming Certificate"],
      lastTrainingDate: new Date("2024-01-17")
    },
    status: "pending",
    stage: "documentation",
    assignedPartner: "partner1",
    assignedAgent: "agent3",
    createdAt: new Date("2024-01-17"),
    updatedAt: new Date("2024-01-17"),
    notes: ["Documents pending verification"],
    nextFollowUp: new Date("2024-01-24"),
    priority: "medium",
    estimatedCompletionDate: new Date("2024-02-25")
  },
  {
    _id: "5",
    farmer: {
      name: "David Brown",
      email: "david@farmer.com",
      phone: "+2348012345682",
      location: "Kaduna",
      state: "Kaduna",
      lga: "Kaduna North",
      village: "Ungwan Rimi",
      coordinates: {
        latitude: 10.5222,
        longitude: 7.4384
      },
      farmSize: 3.0,
      farmSizeUnit: "hectares",
      primaryCrops: ["Maize", "Rice", "Vegetables"],
      farmingExperience: "beginner",
      educationLevel: "none",
      householdSize: 7,
      annualIncome: 280000,
      incomeSource: "farming"
    },
    documents: {
      idCard: "https://example.com/id5.jpg",
      passportPhoto: "https://example.com/photo5.jpg"
    },
    training: {
      completedModules: ["Basic Farming"],
      currentModule: "Soil Management",
      progress: 25,
      certificates: [],
      lastTrainingDate: new Date("2024-01-16")
    },
    status: "on_hold",
    stage: "training",
    assignedPartner: "partner1",
    assignedAgent: "agent2",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-16"),
    notes: ["Training on hold due to family emergency", "Will resume next week"],
    nextFollowUp: new Date("2024-01-30"),
    priority: "low",
    estimatedCompletionDate: new Date("2024-03-15")
  }
]

export const mockOnboardingStats: OnboardingStats = {
  total: 5,
  pending: 1,
  inProgress: 3,
  completed: 0,
  rejected: 0,
  onHold: 1,
  thisWeek: 2,
  thisMonth: 5,
  averageCompletionTime: 28,
  successRate: 80,
  regionalDistribution: {
    "Lagos": 1,
    "FCT": 1,
    "Kano": 1,
    "Ondo": 1,
    "Kaduna": 1
  },
  cropDistribution: {
    "Tomatoes": 1,
    "Cassava": 1,
    "Maize": 3,
    "Rice": 2,
    "Yam": 1,
    "Cocoa": 1,
    "Plantain": 1,
    "Sorghum": 1,
    "Groundnut": 1,
    "Vegetables": 1
  }
}

export const mockOnboardingTemplates: OnboardingTemplate[] = [
  {
    _id: "1",
    name: "Welcome Message",
    type: "sms",
    content: "Welcome to GroChain, {{farmerName}}! We're excited to have you join our farming community. Your agent {{agentName}} will contact you within 24 hours to begin your onboarding journey.",
    variables: ["farmerName", "agentName"],
    category: "welcome",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  },
  {
    _id: "2",
    name: "Training Reminder",
    type: "sms",
    content: "Hi {{farmerName}}, this is a reminder that your {{moduleName}} training session is scheduled for {{date}} at {{time}}. Please ensure you're available.",
    variables: ["farmerName", "moduleName", "date", "time"],
    category: "reminder",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  },
  {
    _id: "3",
    name: "Document Verification",
    type: "email",
    subject: "Document Verification Required - GroChain Onboarding",
    content: "Dear {{farmerName}}, we need to verify your documents to complete your onboarding. Please upload the following: {{documentList}}. Contact {{agentName}} if you need assistance.",
    variables: ["farmerName", "documentList", "agentName"],
    category: "verification",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  },
  {
    _id: "4",
    name: "Completion Congratulations",
    type: "sms",
    content: "Congratulations {{farmerName}}! You've successfully completed your GroChain onboarding. You can now access our marketplace and start selling your produce. Welcome to the family!",
    variables: ["farmerName"],
    category: "completion",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  }
]

export const mockOnboardingWorkflow: OnboardingWorkflow = {
  _id: "1",
  name: "Standard Farmer Onboarding",
  stages: [
    {
      name: "Registration",
      order: 1,
      required: true,
      estimatedDuration: 1,
      actions: ["Collect basic information", "Verify contact details"],
      dependencies: []
    },
    {
      name: "Documentation",
      order: 2,
      required: true,
      estimatedDuration: 3,
      actions: ["Upload ID card", "Upload land documents", "Upload passport photo"],
      dependencies: ["Registration"]
    },
    {
      name: "Training",
      order: 3,
      required: true,
      estimatedDuration: 14,
      actions: ["Complete basic farming module", "Complete soil management", "Complete crop protection"],
      dependencies: ["Documentation"]
    },
    {
      name: "Verification",
      order: 4,
      required: true,
      estimatedDuration: 2,
      actions: ["Verify documents", "Verify training completion", "Site visit if needed"],
      dependencies: ["Training"]
    },
    {
      name: "Activation",
      order: 5,
      required: true,
      estimatedDuration: 1,
      actions: ["Create marketplace account", "Send welcome package", "Assign farmer ID"],
      dependencies: ["Verification"]
    }
  ],
  isActive: true,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01")
}
