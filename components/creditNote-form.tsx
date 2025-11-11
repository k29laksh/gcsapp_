// components/forms/CreditNoteForm.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Save } from "lucide-react"
import { useGetCustomersQuery } from "@/redux/Service/customer"
import { useGenerateCreditNoteNumberQuery } from "@/redux/Service/credit-notes"

interface CustomerContact {
  id: string
  title: string
  first_name: string
  last_name: string
  designation: string
  email: string
  phone: string
  alternate_phone: string | null
  notes: string
  is_primary: boolean
}

interface CustomerAddress {
  id: string
  address_type: string
  address_line1: string
  address_line2: string
  country: string
  state: string
  city: string
  postal_code: string
}

interface Customer {
  id: string
  contacts: CustomerContact[]
  addresses: CustomerAddress[]
  customer_type: string
  company_name: string
  gst_number: string
  pan_number: string
  gst_state: string
  gst_type: string
  credit_terms_days: number
  credit_limit: string
  created_at: string
}

interface CreditNoteFormData {
  note_number: number | string
  date: string
  customer: string
  reference: string
  reason: string
  notes: string
}

interface CreditNoteFormProps {
  mode: "create" | "edit"
  initialData?: CreditNoteFormData & { id?: string }
  onSubmit: (data: CreditNoteFormData) => Promise<void>
  loading?: boolean
  breadcrumbs: Array<{ label: string; href?: string }>
  title: string
  description: string
}

export function CreditNoteForm({
  mode,
  initialData,
  onSubmit,
  loading = false,
  breadcrumbs,
  title,
  description,
}: CreditNoteFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  // RTK Query hooks
  const { data: customersData, isLoading: customersLoading } = useGetCustomersQuery()
  const { data: generatedNumber, refetch: generateNumber } = useGenerateCreditNoteNumberQuery(undefined, {
    skip: mode !== "create",
  })

  const [formData, setFormData] = useState<CreditNoteFormData>({
    note_number: "",
    date: new Date().toISOString().split("T")[0],
    customer: "",
    reference: "",
    reason: "",
    notes: "",
  })

  const [isCustomerSelected, setIsCustomerSelected] = useState(false)

  // Initialize form with data - including customer selection for edit mode
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormData({
        note_number: initialData.note_number,
        date: initialData.date,
        customer: initialData.customer, // This will be the customer ID from credit note
        reference: initialData.reference,
        reason: initialData.reason,
        notes: initialData.notes,
      })
      setIsCustomerSelected(true)
    }
  }, [mode, initialData])

  // Set generated number for create mode
  useEffect(() => {
    if (mode === "create" && generatedNumber) {
      setFormData((prev) => ({ 
        ...prev, 
        note_number: generatedNumber.note_number || generatedNumber.creditNumber || ""
      }))
    }
  }, [generatedNumber, mode])

  // Get customer name for display
  const getCustomerDisplayName = (customerId: string) => {
    if (!customersData || !customerId) return ""
    
    const customer = customersData.find((cust: Customer) => cust.id === customerId)
    if (!customer) return ""

    // Use company name for Company type, or primary contact name for Individual type
    if (customer.customer_type === "Company" && customer.company_name) {
      return customer.company_name
    } else {
      const primaryContact = customer.contacts.find(contact => contact.is_primary)
      if (primaryContact) {
        return `${primaryContact.first_name} ${primaryContact.last_name}`
      } else if (customer.contacts.length > 0) {
        const firstContact = customer.contacts[0]
        return `${firstContact.first_name} ${firstContact.last_name}`
      }
    }
    
    return `Customer #${customerId}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.customer || !formData.reason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Prepare data for API
    const submitData = {
      ...formData,
      note_number: typeof formData.note_number === 'string' ? parseInt(formData.note_number) || 0 : formData.note_number,
    }

    try {
      await onSubmit(submitData)
    } catch (error) {
      // Error handling is done in the parent component
      console.error("Form submission error:", error)
    }
  }

  const handleInputChange = (field: keyof CreditNoteFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Track if customer has been manually selected
    if (field === 'customer') {
      setIsCustomerSelected(true)
    }
  }

  const customers = customersData || []

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        action={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Credit Note Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Credit Note Number */}
              <div className="space-y-2">
                <Label htmlFor="note_number">Credit Note Number *</Label>
                <Input
                  id="note_number"
                  value={formData.note_number}
                  onChange={(e) => handleInputChange('note_number', e.target.value)}
                  required
                  disabled={mode === "create"} // Auto-generated, can't be edited
                  placeholder="Auto-generated"
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>

             {/* Customer Select */}
<div className="space-y-2">
  <Label htmlFor="customer">Customer *</Label>
  <Select
    value={formData.customer}
    onValueChange={(value) => handleInputChange("customer", value)}
    required
    disabled={customersLoading}
  >
    <SelectTrigger>
      <SelectValue
        placeholder={
          customersLoading
            ? "Loading customers..."
            : formData.customer
            ? getCustomerDisplayName(formData.customer)
            : "Select customer"
        }
      >
        {formData.customer && getCustomerDisplayName(formData.customer)}
      </SelectValue>
    </SelectTrigger>

    <SelectContent>
      {customers.map((customer: Customer) => (
        <SelectItem key={customer.id} value={customer.id}>
          {customer.customer_type === "Company" && customer.company_name
            ? customer.company_name
            : (() => {
                const primaryContact = customer.contacts.find(
                  (contact) => contact.is_primary
                );
                if (primaryContact) {
                  return `${primaryContact.first_name} ${primaryContact.last_name}`;
                } else if (customer.contacts.length > 0) {
                  const firstContact = customer.contacts[0];
                  return `${firstContact.first_name} ${firstContact.last_name}`;
                }
                return `Customer #${customer.id}`;
              })()}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>

  {mode === "edit" && formData.customer && (
    <p className="text-xs text-muted-foreground mt-1">
      Current customer: {getCustomerDisplayName(formData.customer)}
    </p>
  )}
</div>


              {/* Reference */}
              <div className="space-y-2">
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => handleInputChange('reference', e.target.value)}
                  placeholder="Reference number or invoice"
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                placeholder="Reason for credit note"
                required
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading 
                  ? (mode === "create" ? "Creating..." : "Updating...")
                  : (mode === "create" ? "Create Credit Note" : "Update Credit Note")
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// PageHeader component (if not exists)
interface PageHeaderProps {
  title: string
  description: string
  breadcrumbs: Array<{ label: string; href?: string }>
  action?: React.ReactNode
}

function PageHeader({ title, description, breadcrumbs, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {action && <div className="mt-4 sm:mt-0">{action}</div>}
    </div>
  )
}