"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useGetInvoicesQuery } from "@/redux/Service/invoice"
import { useGetCustomersQuery } from "@/redux/Service/customer"
import { useAddPaymentMutation, useUpdatePaymentMutation } from "@/redux/Service/payment"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface PaymentFormData {
  reference_no: string
  receipt_no: string
  payment_date: string
  customer_id: string
  invoice_id: string
  amount: string
  method: string
  transaction_id: string
  status: string
  notes: string
}

interface PaymentFormProps {
  initialData?: PaymentFormData
  paymentId?: string
}

export default function PaymentForm({ initialData, paymentId }: PaymentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  // Fetch invoices and customers
  const { data: invoices, isLoading: invoicesLoading } = useGetInvoicesQuery({})
  const { data: customers, isLoading: customersLoading } = useGetCustomersQuery({})
  
  // Add and update payment mutations
  const [addPayment, { isLoading: isAdding }] = useAddPaymentMutation()
  const [updatePayment, { isLoading: isUpdating }] = useUpdatePaymentMutation()
  
  const isSubmitting = isAdding || isUpdating
  const isEditMode = !!paymentId

  const [formData, setFormData] = useState<PaymentFormData>(
    initialData || {
      reference_no: "",
      receipt_no: "",
      payment_date: "",
      customer_id: "",
      invoice_id: "",
      amount: "",
      method: "Bank Transfer",
      transaction_id: "",
      status: "completed",
      notes: "",
    },
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle invoice selection - auto-select customer and amount
  const handleInvoiceChange = (invoiceId: string) => {
    const selectedInvoice = invoices?.find((inv: { id: string; customer: string; total_amount: string; invoice_no: string }) => inv.id === invoiceId)
    
    if (selectedInvoice) {
      // Generate receipt number: RCPT-YEAR-InvoiceNumber (only in create mode)
      const currentYear = new Date().getFullYear()
      const invoiceNumber = selectedInvoice.invoice_no.replace("INV-", "") // Remove "INV-" prefix
      const receiptNumber = `RCPT-${currentYear}-${invoiceNumber}`
      
      setFormData((prev) => ({
        ...prev,
        invoice_id: invoiceId,
        customer_id: selectedInvoice.customer,
        amount: selectedInvoice.total_amount,
        // Only auto-generate receipt number in create mode
        receipt_no: isEditMode ? prev.receipt_no : receiptNumber,
      }))
    } else {
      setFormData((prev) => ({ ...prev, invoice_id: invoiceId }))
    }
  }

  // Auto-select customer and amount when form loads in edit mode with an invoice_id
  useEffect(() => {
    if (isEditMode && formData.invoice_id && invoices && invoices.length > 0) {
      const selectedInvoice = invoices.find((inv: { id: string; customer: string; total_amount: string }) => inv.id === formData.invoice_id)
      if (selectedInvoice) {
        // Only update if values are different to avoid unnecessary re-renders
        if (selectedInvoice.customer !== formData.customer_id || selectedInvoice.total_amount !== formData.amount) {
          setFormData((prev) => ({
            ...prev,
            customer_id: selectedInvoice.customer,
            amount: selectedInvoice.total_amount,
          }))
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, invoices])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (isEditMode && paymentId) {
        // Update existing payment
        await updatePayment({ id: paymentId, ...formData }).unwrap()
        toast({
          title: "Success",
          description: "Payment updated successfully",
        })
      } else {
        // Create new payment
        await addPayment(formData).unwrap()
        toast({
          title: "Success",
          description: "Payment added successfully",
        })
      }
      
      router.push("/sales/payment")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'add'} payment`,
        variant: "destructive",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Receipt Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Receipt Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input
                id="payment_date"
                name="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receipt_no">Receipt Number</Label>
              <Input
                id="receipt_no"
                name="receipt_no"
                placeholder="RCPT-2025-001"
                value={formData.receipt_no}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_id">Invoice</Label>
              <Select
                value={formData.invoice_id}
                onValueChange={handleInvoiceChange}
              >
                <SelectTrigger id="invoice_id">
                  <SelectValue placeholder="Select Invoice" />
                </SelectTrigger>
                <SelectContent>
                  {invoicesLoading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : (
                    invoices?.map((invoice: { id: string; invoice_no: string; total_amount: string; customer: string }) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        {invoice.invoice_no} - ₹{invoice.total_amount}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_id">Customer {formData.invoice_id && "(Auto-selected from invoice)"}</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) => handleSelectChange("customer_id", value)}
                disabled={!!formData.invoice_id}
              >
                <SelectTrigger id="customer_id">
                  <SelectValue placeholder="Select Customer" />
                </SelectTrigger>
                <SelectContent>
                  {customersLoading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : (
                    customers?.map((customer: { id: string; contacts: { first_name: string; last_name: string; designation: string }[] }) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer?.contacts[0].first_name} {customer?.contacts[0].last_name} - {customer?.contacts[0].designation}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reference_no">Reference Number</Label>
            <Input
              id="reference_no"
              name="reference_no"
              placeholder="PAY-2025-001"
              value={formData.reference_no}
              onChange={handleChange}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Amount and Method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount {formData.invoice_id && "(From invoice)"}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground">₹</span>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder="12500.50"
                  value={formData.amount}
                  onChange={handleChange}
                  className="pl-8"
                  step="0.01"
                  required
                  readOnly={!!formData.invoice_id}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Payment Method</Label>
              <Select
                value={formData.method}
                onValueChange={(value) => handleSelectChange("method", value)}
              >
                <SelectTrigger id="method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transaction_id">Transaction ID</Label>
              <Input
                id="transaction_id"
                name="transaction_id"
                placeholder="TXN-2025-0001"
                value={formData.transaction_id}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Payment Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notes">Payment Notes/Remarks</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Add any additional notes or payment remarks"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Buttons */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Saving..." : "Save Payment"}
        </Button>
        <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
