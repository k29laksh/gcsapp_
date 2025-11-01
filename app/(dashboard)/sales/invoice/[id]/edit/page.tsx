"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { InvoiceForm } from "@/components/invoice-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { 
  useGetSingleInvoiceQuery, 
  useUpdateInvoiceMutation,
} from "@/redux/Service/invoice"
import { useGetCustomersQuery } from "@/redux/Service/customer"
import { useGetVesselsQuery } from "@/redux/Service/vessel"
import { useGetProjectsQuery } from "@/redux/Service/projects"

export default function EditInvoicePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const invoiceId = params.id as string

  // RTK Query hooks
  const { 
    data: invoice, 
    isLoading: isLoadingInvoice, 
    error: invoiceError 
  } = useGetSingleInvoiceQuery(invoiceId, { skip: !invoiceId })

  const [updateInvoice] = useUpdateInvoiceMutation()

  // Fetch related data
  const { data: customersData } = useGetCustomersQuery({})
  const { data: projectsData } = useGetProjectsQuery({})
  const { data: vesselsData } = useGetVesselsQuery({})

  const handleSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true)

      // Prepare data in the exact format expected by backend
      const submissionData = {
        customer: formData.customer,
        project: formData.project,
        vessel: formData.vessel,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date,
        status: formData.status,
        place_of_supply: formData.place_of_supply,
        sgst: parseFloat(formData.sgst) || 0,
        cgst: parseFloat(formData.cgst) || 0,
        igst: parseFloat(formData.igst) || 0,
        po_no: formData.po_no || "",
        our_ref: formData.our_ref || "",
        items: formData.items.map((item: any) => ({
          description: item.description,
          quantity: parseFloat(item.quantity) || 0,
          unit_price: parseFloat(item.unit_price) || 0,
        })),
      }

      await updateInvoice({
        id: invoiceId,
        ...submissionData
      }).unwrap()

      toast({
        title: "Success",
        description: "Invoice updated successfully",
      })

      // Redirect to invoices list
      router.push("/sales/invoice")
      router.refresh()
    } catch (error: any) {
      console.error("Error updating invoice:", error)
      toast({
        title: "Error",
        description: error?.data?.message || error?.data?.detail || "Failed to update invoice",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingInvoice) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (invoiceError || !invoice) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-lg font-semibold mb-2">Invoice not found</p>
          <p className="text-muted-foreground mb-4">
            The invoice you're trying to edit doesn't exist or you don't have permission to access it.
          </p>
          <Button onClick={() => router.push('/sales/invoice')}>
            Back to Invoices
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Invoice</h1>
            <p className="text-muted-foreground">
              Update invoice #{invoice.invoice_no || invoice.id}
            </p>
          </div>
        </div>
      </div>

      <InvoiceForm 
        onSubmit={handleSubmit} 
        isSubmitting={isSubmitting} 
        initialData={invoice}
        customers={customersData || []}
        projects={projectsData || []}
        vessels={vesselsData || []}
        isEditing={true} 
        invoiceId={invoiceId}
      />
    </div>
  )
}