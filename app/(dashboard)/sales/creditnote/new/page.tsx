// app/sales/creditnote/new/page.tsx
"use client"

import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { CreditNoteForm } from "@/components/creditNote-form"
import { useAddCreditNoteMutation } from "@/redux/Service/credit-notes"

export default function NewCreditNotePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [addCreditNote, { isLoading }] = useAddCreditNoteMutation()

  const handleSubmit = async (formData: any) => {
    try {
      await addCreditNote(formData).unwrap()
      
      toast({
        title: "Success",
        description: "Credit note created successfully",
      })

      router.push("/sales/creditnote")
    } catch (error) {
      console.error("Error creating credit note:", error)
      toast({
        title: "Error",
        description: "Failed to create credit note",
        variant: "destructive",
      })
      throw error // Re-throw to let form handle it
    }
  }

  const breadcrumbs = [
    { label: "Sales", href: "/sales" },
    { label: "Credit Notes", href: "/sales/creditnote" },
    { label: "New Credit Note" },
  ]

  return (
    <CreditNoteForm
      mode="create"
      onSubmit={handleSubmit}
      loading={isLoading}
      breadcrumbs={breadcrumbs}
      title="New Credit Note"
      description="Create a new credit note for customer refunds"
    />
  )
}