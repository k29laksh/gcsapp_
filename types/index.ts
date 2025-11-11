// Employee types
export interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  jobTitle: string
  department: string
  basicSalary: number | null
  hourlyRate: number | null
  reportingManagerId: string | null
  employmentType: string
  phoneNumber?: string
  address?: string
  createdAt?: Date
  updatedAt?: Date
}

// Customer types
export interface Customer {
  id: string
  customerType: string
  companyName?: string
  gstNumber?: string
  panNumber?: string
  gstState?: string
  gstType?: string
  creditTerms: number
  creditLimit: number
  contacts: Contact[]
  billingAddress?: Address
  shippingAddress?: Address
  createdAt?: Date
  updatedAt?: Date
}

export interface Contact {
  id?: string
  title: string
  firstName: string
  lastName: string
  designation: string
  email: string
  phone: string
  alternatePhone: string
  isPrimary: boolean
  notes: string
}

export interface Address {
  id?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

// Vendor types
export interface Vendor {
  id: string
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
  gstNumber?: string
  panNumber?: string
  bankDetails?: string
  paymentTerms?: number
  createdAt?: Date
  updatedAt?: Date
}

// Project types
export interface Project {
  id: string
  name: string
  description?: string
  startDate: Date
  endDate?: Date
  status: string
  budget?: number
  customerId: string
  customer?: Customer
  tasks?: Task[]
  createdAt?: Date
  updatedAt?: Date
}

export interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: Date
  assigneeId?: string
  assignee?: Employee
  projectId: string
  project?: Project
  createdAt?: Date
  updatedAt?: Date
}

// Purchase Order types
export interface PO {
  id: string
  poNumber: string
  date: Date
  vendorId: string
  vendor?: Vendor
  projectId?: string
  project?: Project
  subtotal: number
  tax: number
  total: number
  notes?: string
  status: string
  items: POItem[]
  bills?: Bill[]
  createdAt?: Date
  updatedAt?: Date
}

export interface POItem {
  id: string
  poId: string
  description: string
  quantity: number
  unitPrice: number
  tax: number
  total: number
  hsn?: string
  sacCode?: string
}

// Bill types
export interface Bill {
  id: string
  billNumber: string
  date: Date
  dueDate: Date
  vendorId: string
  vendor?: Vendor
  poId?: string
  po?: PO
  subtotal: number
  tax: number
  total: number
  amountPaid: number
  amountDue: number
  notes?: string
  status: string
  items: BillItem[]
  payments?: VendorPayment[]
  createdAt?: Date
  updatedAt?: Date
}

export interface BillItem {
  id: string
  billId: string
  description: string
  quantity: number
  unitPrice: number
  tax: number
  total: number
  hsn?: string
  sacCode?: string
}

export interface VendorPayment {
  id: string
  date: Date
  amount: number
  paymentMethod: string
  reference?: string
  notes?: string
  billId: string
  bill?: Bill
  vendorId: string
  vendor?: Vendor
  createdAt?: Date
  updatedAt?: Date
}

// Vessel types
export interface Vessel {
  id: string
  vesselName: string
  imoNumber?: string
  vesselType: string
  flag?: string
  classificationSociety?: string
  classNotation?: string
  buildYear?: number
  shipyard?: string
  length?: number
  breadth?: number
  depth?: number
  grossTonnage?: number
  netTonnage?: number
  deadweight?: number
  customerId: string
  customer?: Customer
  projects?: Project[]
  createdAt?: Date
  updatedAt?: Date
}

// HR types
export interface LeaveType {
  id: string
  name: string
  description?: string
  allowedDays: number
  isPaid: boolean
  leaveRequests?: LeaveRequest[]
  createdAt?: Date
  updatedAt?: Date
}

export interface LeaveRequest {
  id: string
  employeeId: string
  employee?: Employee
  leaveTypeId: string
  leaveType?: LeaveType
  startDate: Date
  endDate: Date
  totalDays: number
  reason?: string
  status: string
  approvedById?: string
  approvedBy?: Employee
  createdAt?: Date
  updatedAt?: Date
}

// Expense types
export interface Expense {
  id: string
  date: Date
  vendorId: string
  vendor?: Vendor
  category: string
  amount: number
  description?: string
  reference?: string
  projectId?: string
  project?: Project
  accountId?: string
  account?: Account
  createdAt?: Date
  updatedAt?: Date
}

export interface Account {
  id: string
  name: string
  accountNumber: string
  bankName: string
  ifscCode?: string
  balance: number
  accountType: string
  createdAt?: Date
  updatedAt?: Date
}

// NextAuth types
export interface User {
  id: string
  name?: string | null
  email?: string | null
  role?: string
}

declare module "next-auth" {
  interface Session {
    user: User
  }

  interface User {
    role?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
  }
}
