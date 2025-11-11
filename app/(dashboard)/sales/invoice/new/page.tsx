"use client"
import { useRouter } from "next/navigation"
import { InvoiceForm } from "@/components/invoice-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function NewInvoicePage() {
  const router = useRouter()

  
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

      <InvoiceForm  />
    </div>
  )
}

