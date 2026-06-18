export const mockSuppliers = [
  { id: "sup-1", company: "CleanPro Services", abn: "12 345 678 901", trade: "Cleaning", contact: "Mark Dawson", phone: "0412 111 222", email: "mark@cleanpro.com.au", rating: 5, activeJobs: 2 },
  { id: "sup-2", company: "GreenScape Gardens", abn: "23 456 789 012", trade: "Gardening", contact: "Lisa Park", phone: "0423 222 333", email: "lisa@greenscape.com.au", rating: 4, activeJobs: 1 },
  { id: "sup-3", company: "LiftTech Australia", abn: "34 567 890 123", trade: "Lift Maintenance", contact: "Brad Wilson", phone: "0434 333 444", email: "brad@lifttech.com.au", rating: 5, activeJobs: 1 },
  { id: "sup-4", company: "AquaFlow Plumbing", abn: "45 678 901 234", trade: "Plumbing", contact: "Tony Nguyen", phone: "0445 444 555", email: "tony@aquaflow.com.au", rating: 3, activeJobs: 0 },
  { id: "sup-5", company: "SafeGuard Fire", abn: "56 789 012 345", trade: "Fire Safety", contact: "Rachel Kim", phone: "0456 555 666", email: "rachel@safeguard.com.au", rating: 5, activeJobs: 1 },
  { id: "sup-6", company: "ElectroPro", abn: "67 890 123 456", trade: "Electrical", contact: "Steve Turner", phone: "0467 666 777", email: "steve@electropro.com.au", rating: 4, activeJobs: 1 },
  { id: "sup-7", company: "PaintMaster", abn: "78 901 234 567", trade: "Painting", contact: "Jay Singh", phone: "0478 777 888", email: "jay@paintmaster.com.au", rating: 3, activeJobs: 0 },
  { id: "sup-8", company: "SecureEntry", abn: "89 012 345 678", trade: "Security", contact: "Nina Cook", phone: "0489 888 999", email: "nina@secureentry.com.au", rating: 4, activeJobs: 0 },
]

export const mockWorkOrders = [
  { id: "WO-001", planId: "1", planName: "Southbank Residences", supplierId: "sup-1", supplierName: "CleanPro Services", description: "Monthly cleaning June", status: "completed", quote: 770, priority: "normal", createdDate: "2026-06-01" },
  { id: "WO-002", planId: "1", planName: "Southbank Residences", supplierId: "sup-3", supplierName: "LiftTech Australia", description: "Annual lift inspection", status: "in-progress", quote: 2200, priority: "normal", createdDate: "2026-05-15" },
  { id: "WO-003", planId: "2", planName: "Collins St Apartments", supplierId: "sup-4", supplierName: "AquaFlow Plumbing", description: "Fix lobby tap", status: "completed", quote: 280, priority: "urgent", createdDate: "2026-05-20" },
  { id: "WO-004", planId: "3", planName: "St Kilda Beach Villas", supplierId: "sup-2", supplierName: "GreenScape Gardens", description: "Garden maintenance", status: "sent", quote: 450, priority: "normal", createdDate: "2026-06-10" },
  { id: "WO-005", planId: "1", planName: "Southbank Residences", supplierId: "sup-5", supplierName: "SafeGuard Fire", description: "Fire system annual check", status: "accepted", quote: 1800, priority: "normal", createdDate: "2026-06-05" },
  { id: "WO-006", planId: "2", planName: "Collins St Apartments", supplierId: "sup-6", supplierName: "ElectroPro", description: "Replace common area lights", status: "draft", quote: 640, priority: "low", createdDate: "2026-06-15" },
]

export const mockQuotes = [
  { woId: "WO-002", supplier: "LiftTech Australia", amount: 2200, leadTime: "3 days", warranty: "12 months", rating: 5, recommended: true },
  { woId: "WO-002", supplier: "ElevatorPro", amount: 2850, leadTime: "1 week", warranty: "6 months", rating: 3, recommended: false },
  { woId: "WO-002", supplier: "OtisService", amount: 1950, leadTime: "2 weeks", warranty: "12 months", rating: 4, recommended: false },
]
