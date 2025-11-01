"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { PageHeader } from "@/components/ui/page-header"
import { ArrowLeft, Edit, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  useGetSingleCreditNoteQuery,
  useDeleteCreditNoteMutation,
} from "@/redux/Service/credit-notes"
import { useEffect } from "react"

interface CreditNote {
  id: string
  note_number: number
  date: string
  reference: string
  reason: string
  notes: string
  customer: string
}

export default function CreditNoteDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  
  // RTK Query hooks
  const { 
    data: creditNote, 
    isLoading, 
    error 
  } = useGetSingleCreditNoteQuery(params.id)
  
  const [deleteCreditNote] = useDeleteCreditNoteMutation()

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load credit note",
        variant: "destructive",
      })
    }
  }, [error, toast])

  const handleDelete = async () => {
    try {
      await deleteCreditNote(params.id).unwrap()
      
      toast({
        title: "Success",
        description: "Credit note deleted successfully",
      })

      router.push("/sales/creditnote")
    } catch (error) {
      console.error("Error deleting credit note:", error)
      toast({
        title: "Error",
        description: "Failed to delete credit note",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!creditNote) {
    return <div>Credit note not found</div>
  }

  const breadcrumbs = [
    { label: "Sales", href: "/sales" },
    { label: "Credit Notes", href: "/sales/creditnote" },
    { label: `CN-${creditNote.note_number}` },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Credit Note CN-${creditNote.note_number}`}
        description="View credit note details"
        breadcrumbs={breadcrumbs}
        action={
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={() => router.push(`/sales/creditnote/${params.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the credit note.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Credit Note Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Credit Note Number</label>
                <p className="text-lg font-semibold">CN-{creditNote.note_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date</label>
                <p>{formatDate(creditNote.date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reference</label>
                <p>{creditNote.reference || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Customer ID</label>
                <p className="text-sm font-mono">{creditNote.customer}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reason</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{creditNote.reason}</p>
          </CardContent>
        </Card>

        {creditNote.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{creditNote.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}