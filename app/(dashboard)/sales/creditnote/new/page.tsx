"use client"

import CreditNoteForm from "@/components/creditNote-form"

export default function NewCreditNotePage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className=" mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Create Credit Note</h1>
          <p className="text-sm text-muted-foreground mt-1">Fill in the details to create a new credit note</p>
        </div>
        <CreditNoteForm />
      </div>
    </div>
  )
}
