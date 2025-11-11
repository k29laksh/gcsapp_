"use client"

import { useParams } from "next/navigation"
import { useGetSingleCreditNoteQuery } from "@/redux/Service/credit-notes"
import CreditNoteForm from "@/components/creditNote-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function EditCreditNotePage() {
  const params = useParams()
  const id = params.id as string
  const { data: creditNote, isLoading, error } = useGetSingleCreditNoteQuery(id)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
        <p>Loading credit note...</p>
      </div>
    )
  }

  if (error || !creditNote) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold mb-4">Credit Note not found</p>
          <Link href="/sales/creditnote">
            <Button>Back to Credit Notes</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Transform API data to form format
  const initialData = {
    note_no: creditNote.note_no,
    date: creditNote.date,
    status: creditNote.status,
    customer_id: creditNote.customer?.id || "",
    contact_person: creditNote.contact_person || "",
    contact_email: creditNote.contact_email || "",
    contact_number: creditNote.contact_number || "",
    invoice_id: creditNote.invoice?.id || "",
    place_of_supply: creditNote.place_of_supply || "",
    P_O_no: creditNote.P_O_no || "",
    reference: creditNote.reference || "",
    vessel_id: creditNote.vessel?.id || "",
    items: creditNote.items?.map((item: any) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
    })) || [],
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className=" mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Edit Credit Note</h1>
          <p className="text-sm text-muted-foreground mt-1">{creditNote.note_no}</p>
        </div>
        <CreditNoteForm initialData={initialData} creditNoteId={id} />
      </div>
    </div>
  )
}
