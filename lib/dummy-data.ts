// Dummy data for delivery challans
export const dummyChallans = [
  {
    id: "DC-001",
    orderDate: "2024-01-15",
    orderNo: "ORD-2024-001",
    deliveryNoteNo: "DN-001",
    invoiceNo: "INV-2024-001",
    dispatchDate: "2024-01-16",
    deliveryMethod: "Standard",
    vehicleNo: "MH01AB1234",
    status: "Delivered",
    shippingPersonName: "Rajesh Kumar",
    shippingCompany: "ABC PVT. LTD.",
    shippingAddress: "123 Marine Drive, Bandra, Mumbai, Maharashtra 400050",
    shippingPhone: "+91 9876543210",
    billingPersonName: "Rajesh Kumar",
    billingCompany: "ABC PVT. LTD.",
    billingAddress: "123 Marine Drive, Bandra, Mumbai, Maharashtra 400050",
    billingPhone: "+91 9876543210",
    items: [
      {
        id: "1",
        itemNo: "1",
        description: "Fire Protection System Component",
        unitWeight: "2.5",
        totalWeight: "25",
        quantity: "10",
        remark: "Fragile",
        boxWeight: "3",
        packingBoxNo: "BOX-001",
      },
      {
        id: "2",
        itemNo: "2",
        description: "Marine Equipment",
        unitWeight: "5",
        totalWeight: "50",
        quantity: "10",
        remark: "Handle with care",
        boxWeight: "6",
        packingBoxNo: "BOX-002",
      },
    ],
  },
  {
    id: "DC-002",
    orderDate: "2024-01-20",
    orderNo: "ORD-2024-002",
    deliveryNoteNo: "DN-002",
    invoiceNo: "INV-2024-002",
    dispatchDate: "2024-01-21",
    deliveryMethod: "Express",
    vehicleNo: "MH02CD5678",
    status: "Pending",
    shippingPersonName: "Priya Singh",
    shippingCompany: "XYZ Industries",
    shippingAddress: "456 Offshore Road, Kakinada, Andhra Pradesh 533001",
    shippingPhone: "+91 8765432109",
    billingPersonName: "Priya Singh",
    billingCompany: "XYZ Industries",
    billingAddress: "456 Offshore Road, Kakinada, Andhra Pradesh 533001",
    billingPhone: "+91 8765432109",
    items: [
      {
        id: "1",
        itemNo: "1",
        description: "Offshore Consulting Services",
        unitWeight: "0",
        totalWeight: "0",
        quantity: "1",
        remark: "Service delivery",
        boxWeight: "0",
        packingBoxNo: "N/A",
      },
    ],
  },
  {
    id: "DC-003",
    orderDate: "2024-02-01",
    orderNo: "ORD-2024-003",
    deliveryNoteNo: "DN-003",
    invoiceNo: "INV-2024-003",
    dispatchDate: "2024-02-02",
    deliveryMethod: "Standard",
    vehicleNo: "MH03EF9012",
    status: "In Transit",
    shippingPersonName: "Vikram Patel",
    shippingCompany: "Global Consultancy Services",
    shippingAddress: "789 Industrial Area, Pune, Maharashtra 411016",
    shippingPhone: "+91 7654321098",
    billingPersonName: "Vikram Patel",
    billingCompany: "Global Consultancy Services",
    billingAddress: "789 Industrial Area, Pune, Maharashtra 411016",
    billingPhone: "+91 7654321098",
    items: [
      {
        id: "1",
        itemNo: "1",
        description: "Fire Safety Equipment",
        unitWeight: "3.5",
        totalWeight: "35",
        quantity: "10",
        remark: "Urgent",
        boxWeight: "4",
        packingBoxNo: "BOX-003",
      },
      {
        id: "2",
        itemNo: "2",
        description: "Marine Protection System",
        unitWeight: "8",
        totalWeight: "80",
        quantity: "10",
        remark: "Standard",
        boxWeight: "9",
        packingBoxNo: "BOX-004",
      },
      {
        id: "3",
        itemNo: "3",
        description: "Installation Materials",
        unitWeight: "1.5",
        totalWeight: "15",
        quantity: "10",
        remark: "Standard",
        boxWeight: "2",
        packingBoxNo: "BOX-005",
      },
    ],
  },
  {
    id: "DC-004",
    orderDate: "2024-02-10",
    orderNo: "ORD-2024-004",
    deliveryNoteNo: "DN-004",
    invoiceNo: "INV-2024-004",
    dispatchDate: "2024-02-11",
    deliveryMethod: "Standard",
    vehicleNo: "MH04GH3456",
    status: "Delivered",
    shippingPersonName: "Anjali Sharma",
    shippingCompany: "Maritime Solutions Ltd",
    shippingAddress: "321 Port Authority, Chennai, Tamil Nadu 600004",
    shippingPhone: "+91 6543210987",
    billingPersonName: "Anjali Sharma",
    billingCompany: "Maritime Solutions Ltd",
    billingAddress: "321 Port Authority, Chennai, Tamil Nadu 600004",
    billingPhone: "+91 6543210987",
    items: [
      {
        id: "1",
        itemNo: "1",
        description: "Consultation Report",
        unitWeight: "0.5",
        totalWeight: "0.5",
        quantity: "1",
        remark: "Documents",
        boxWeight: "1",
        packingBoxNo: "BOX-006",
      },
    ],
  },
  {
    id: "DC-005",
    orderDate: "2024-02-15",
    orderNo: "ORD-2024-005",
    deliveryNoteNo: "DN-005",
    invoiceNo: "INV-2024-005",
    dispatchDate: "2024-02-16",
    deliveryMethod: "Express",
    vehicleNo: "MH05IJ7890",
    status: "Processing",
    shippingPersonName: "Arjun Desai",
    shippingCompany: "Offshore Drilling Corp",
    shippingAddress: "654 Oil Fields, Vadodara, Gujarat 390001",
    shippingPhone: "+91 5432109876",
    billingPersonName: "Arjun Desai",
    billingCompany: "Offshore Drilling Corp",
    billingAddress: "654 Oil Fields, Vadodara, Gujarat 390001",
    billingPhone: "+91 5432109876",
    items: [
      {
        id: "1",
        itemNo: "1",
        description: "Drilling Equipment Parts",
        unitWeight: "12",
        totalWeight: "120",
        quantity: "10",
        remark: "Precision parts",
        boxWeight: "15",
        packingBoxNo: "BOX-007",
      },
    ],
  },
]

// Dummy data for payments
export const dummyPayments = [
  {
    id: "PAY-001",
    paymentDate: "2024-01-17",
    invoiceNo: "INV-2024-001",
    receiptNo: "RCP-2024-001",
    payerName: "Rajesh Kumar",
    payerCompany: "ABC PVT. LTD.",
    payerEmail: "rajesh@abc.com",
    payerPhone: "+91 9876543210",
    amountReceived: "25000.00",
    paymentMethod: "Bank Transfer",
    transactionId: "TXN-20240117-001",
    referenceNo: "REF-001",
    status: "Completed",
    notes: "Payment received for fire protection system",
  },
  {
    id: "PAY-002",
    paymentDate: "2024-01-22",
    invoiceNo: "INV-2024-002",
    receiptNo: "RCP-2024-002",
    payerName: "Priya Singh",
    payerCompany: "XYZ Industries",
    payerEmail: "priya@xyz.com",
    payerPhone: "+91 8765432109",
    amountReceived: "50000.00",
    paymentMethod: "Credit Card",
    transactionId: "TXN-20240122-002",
    referenceNo: "REF-002",
    status: "Completed",
    notes: "Offshore consulting services payment",
  },
  {
    id: "PAY-003",
    paymentDate: "2024-02-03",
    invoiceNo: "INV-2024-003",
    receiptNo: "RCP-2024-003",
    payerName: "Vikram Patel",
    payerCompany: "Global Consultancy Services",
    payerEmail: "vikram@globalconsult.com",
    payerPhone: "+91 7654321098",
    amountReceived: "75000.50",
    paymentMethod: "UPI",
    transactionId: "TXN-20240203-003",
    referenceNo: "REF-003",
    status: "Completed",
    notes: "Fire safety equipment payment",
  },
  {
    id: "PAY-004",
    paymentDate: "2024-02-12",
    invoiceNo: "INV-2024-004",
    receiptNo: "RCP-2024-004",
    payerName: "Anjali Sharma",
    payerCompany: "Maritime Solutions Ltd",
    payerEmail: "anjali@maritime.com",
    payerPhone: "+91 6543210987",
    amountReceived: "15000.00",
    paymentMethod: "Cheque",
    transactionId: "CHQ-123456",
    referenceNo: "REF-004",
    status: "Pending",
    notes: "Cheque deposited - awaiting clearance",
  },
  {
    id: "PAY-005",
    paymentDate: "2024-02-17",
    invoiceNo: "INV-2024-005",
    receiptNo: "RCP-2024-005",
    payerName: "Arjun Desai",
    payerCompany: "Offshore Drilling Corp",
    payerEmail: "arjun@drilling.com",
    payerPhone: "+91 5432109876",
    amountReceived: "120000.00",
    paymentMethod: "Bank Transfer",
    transactionId: "TXN-20240217-005",
    referenceNo: "REF-005",
    status: "Completed",
    notes: "Drilling equipment payment",
  },
]

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    Delivered: "bg-green-100 text-green-800",
    "In Transit": "bg-blue-100 text-blue-800",
    Pending: "bg-yellow-100 text-yellow-800",
    Processing: "bg-purple-100 text-purple-800",
    Completed: "bg-green-200 text-green-900", // Added color for Completed status
  }
  return colors[status] || "bg-gray-100 text-gray-800"
}

export function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export interface CreditNoteItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface CreditNote {
  id: string
  creditNoteNo: string
  date: string
  client: {
    name: string
    address: string
    gstin: string
  }
  contactPerson: string
  email: string
  contactNo: string
  againstInvNo: string
  placeOfSupply: string
  poNo: string
  ourRef: string
  vesselName: string
  items: CreditNoteItem[]
  totalAmount: number
  status: "Draft" | "Issued" | "Cancelled"
}

export const dummyCreditNotes: CreditNote[] = [
  {
    id: "1",
    creditNoteNo: "GCSCR29/00/25-26",
    date: "2025-04-01",
    client: {
      name: "ABC PVT. LTD.",
      address: "ABC PVT. LTD.",
      gstin: "abc",
    },
    contactPerson: "abc",
    email: "abc@example.com",
    contactNo: "abc",
    againstInvNo: "abc",
    placeOfSupply: "Select GST State code",
    poNo: "abc",
    ourRef: "abc",
    vesselName: "abc",
    items: [
      {
        id: "1",
        description: "Service Item 1",
        quantity: 1,
        unitPrice: 100,
        amount: 100,
      },
    ],
    totalAmount: 100,
    status: "Issued",
  },
  {
    id: "2",
    creditNoteNo: "GCSCR30/00/25-26",
    date: "2025-03-25",
    client: {
      name: "XYZ CORP",
      address: "XYZ CORP Address",
      gstin: "xyz123",
    },
    contactPerson: "John Doe",
    email: "john@xyz.com",
    contactNo: "9876543210",
    againstInvNo: "INV-2025-005",
    placeOfSupply: "Delhi",
    poNo: "PO-123",
    ourRef: "REF-456",
    vesselName: "Vessel A",
    items: [
      {
        id: "1",
        description: "Product A",
        quantity: 2,
        unitPrice: 500,
        amount: 1000,
      },
      {
        id: "2",
        description: "Product B",
        quantity: 1,
        unitPrice: 300,
        amount: 300,
      },
    ],
    totalAmount: 1300,
    status: "Issued",
  },
  {
    id: "3",
    creditNoteNo: "GCSCR31/00/25-26",
    date: "2025-03-20",
    client: {
      name: "TECH SOLUTIONS",
      address: "Tech Solutions Ltd.",
      gstin: "tech456",
    },
    contactPerson: "Jane Smith",
    email: "jane@tech.com",
    contactNo: "8765432109",
    againstInvNo: "INV-2025-003",
    placeOfSupply: "Mumbai",
    poNo: "PO-789",
    ourRef: "REF-789",
    vesselName: "Vessel B",
    items: [
      {
        id: "1",
        description: "Consulting Services",
        quantity: 5,
        unitPrice: 200,
        amount: 1000,
      },
    ],
    totalAmount: 1000,
    status: "Draft",
  },
]


