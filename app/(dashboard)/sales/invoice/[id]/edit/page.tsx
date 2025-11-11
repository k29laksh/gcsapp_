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
import { useGetProjectsQuery } from "@/redux/Service/projects"
import { useGetVesselsQuery } from "@/redux/Service/vessel"

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
  const { data: customersData } = useGetCustomersQuery()
  const { data: projectsData } = useGetProjectsQuery()
  const { data: vesselsData } = useGetVesselsQuery()

  const handleSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true)

      await updateInvoice({
        id: invoiceId,
        ...formData
      }).unwrap()

      toast({
        title: "Success",
        description: "Invoice updated successfully",
      })

      router.push(`/sales/invoice/${invoiceId}`)
      router.refresh()
    } catch (error: any) {
      console.error("Error updating invoice:", error)
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to update invoice",
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
        <p className="text-destructive">Invoice not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Edit Invoice #{invoice.invoice_no}</h1>
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
      />
    </div>
  )
}