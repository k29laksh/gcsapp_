// app/sales/creditnote/[id]/edit/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { CreditNoteForm } from "@/components/creditNote-form"
import { 
  useGetSingleCreditNoteQuery, 
  useUpdateCreditNoteMutation 
} from "@/redux/Service/credit-notes"

export default function EditCreditNotePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  
  const { data: creditNote, isLoading: isLoadingCreditNote } = useGetSingleCreditNoteQuery(params.id)
  const [updateCreditNote, { isLoading: isUpdating }] = useUpdateCreditNoteMutation()
  
  const [initialData, setInitialData] = useState<any>(null)

  useEffect(() => {
    if (creditNote) {
      setInitialData({
        id: creditNote.id,
        note_number: creditNote.note_number,
        date: creditNote.date,
        customer: creditNote.customer,
        reference: creditNote.reference,
        reason: creditNote.reason,
        notes: creditNote.notes,
      })
    }
  }, [creditNote])

  const handleSubmit = async (formData: any) => {
    try {
      await updateCreditNote({
        id: params.id,
        ...formData
      }).unwrap()
      
      toast({
        title: "Success",
        description: "Credit note updated successfully",
      })

      router.push(`/sales/creditnote/${params.id}`)
    } catch (error) {
      console.error("Error updating credit note:", error)
      toast({
        title: "Error",
        description: "Failed to update credit note",
        variant: "destructive",
      })
      throw error
    }
  }

  if (isLoadingCreditNote) {
    return <div>Loading...</div>
  }

  const breadcrumbs = [
    { label: "Sales", href: "/sales" },
    { label: "Credit Notes", href: "/sales/creditnote" },
    { label: `CN-${initialData?.note_number}`, href: `/sales/creditnote/${params.id}` },
    { label: "Edit" },
  ]

  return (
    <CreditNoteForm
      mode="edit"
      initialData={initialData}
      onSubmit={handleSubmit}
      loading={isUpdating}
      breadcrumbs={breadcrumbs}
      title="Edit Credit Note"
      description="Update credit note details"
    />
  )
}