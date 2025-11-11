"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { InvoiceForm } from "@/components/invoice-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function NewInvoicePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true)

      const response = await fetch("/api/sales/invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create invoice")
      }

      const invoice = await response.json()

      toast({
        title: "Success",
        description: "Invoice created successfully",
      })

      router.push(`/sales/invoice/${invoice.id}`)
      router.refresh()
    } catch (error) {
      console.error("Error creating invoice:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create invoice",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Create New Invoice</h1>
        </div>
      </div>

      <InvoiceForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  )
}
