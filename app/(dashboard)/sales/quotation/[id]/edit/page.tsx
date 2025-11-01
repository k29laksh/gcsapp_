"use client"

import { QuotationForm } from "@/components/quotation-form"
import { useParams } from "next/navigation"

export default function EditQuotationPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Edit Quotation</h2>
      <QuotationForm quotationId={id} isEditing />
    </div>
  )
}