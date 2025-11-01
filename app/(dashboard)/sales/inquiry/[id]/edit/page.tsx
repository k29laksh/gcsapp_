"use client"

import { InquiryForm } from "@/components/inquiry-form"
import { useParams } from "next/navigation"

export default function EditInquiryPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Edit Inquiry</h2>
      <InquiryForm inquiryId={id} isEditing />
    </div>
  )
}