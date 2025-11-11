"use client"
import { formatDate } from "@/lib/dummy-data"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Edit, Printer, ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useGetSingleCreditNoteQuery, useDeleteCreditNoteMutation } from "@/redux/Service/credit-notes"
import { useToast } from "@/hooks/use-toast"

export default function CreditNoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { toast } = useToast()
  
  const { data: note, isLoading, error } = useGetSingleCreditNoteQuery(id)
  const [deleteCreditNote] = useDeleteCreditNoteMutation()

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this credit note? This action cannot be undone.")) {
      try {
        await deleteCreditNote(id).unwrap()
        toast({
          title: "Success",
          description: "Credit note deleted successfully",
        })
        router.push("/sales/creditnote")
      } catch {
        toast({
          title: "Error",
          description: "Failed to delete credit note",
          variant: "destructive",
        })
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
        <p>Loading credit note...</p>
      </div>
    )
  }

  if (error || !note) {
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      issued: "bg-green-100 text-green-800",
      draft: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return colors[status.toLowerCase()] || "bg-gray-100 text-gray-800"
  }

  // Calculate total amount
  const totalAmount = note.items?.reduce((sum: number, item: { rate: string; quantity: number }) => {
    return sum + (Number.parseFloat(item.rate) * item.quantity)
  }, 0) || 0

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className=" mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/sales/creditnote">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{note.note_no}</h1>
              <p className="text-sm text-muted-foreground">
                {note.customer?.company_name || note.customer?.customer_type || "N/A"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 bg-transparent">
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Link href={`/sales/creditnote/${note.id}/edit`}>
              <Button className="gap-2">
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            </Link>
            <Button variant="destructive" className="gap-2" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusColor(note.status)}`}>
            {note.status.charAt(0).toUpperCase() + note.status.slice(1)}
          </span>
        </div>

        {/* Credit Note Details */}
        <Card className="p-6 mb-6 border-2">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">CREDIT NOTE</h2>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Left Column */}
            <div>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-semibold">
                  {note.customer?.company_name || note.customer?.customer_type || "N/A"}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="text-sm">
                  {note.customer?.addresses?.[0]
                    ? `${note.customer.addresses[0].address_line1}, ${note.customer.addresses[0].city}, ${note.customer.addresses[0].state} - ${note.customer.addresses[0].postal_code}`
                    : "N/A"}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Contact Person</p>
                <p className="text-sm">{note.contact_person || "N/A"}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm">{note.contact_email || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contact No.</p>
                <p className="text-sm">{note.contact_number || "N/A"}</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="text-right">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Credit Note No.</p>
                <p className="font-bold text-lg">{note.note_no}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-semibold">{formatDate(note.date)}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Customer GSTIN</p>
                <p className="text-sm">{note.customer?.gst_number || "N/A"}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Against Inv. No.</p>
                <p className="text-sm">{note.invoice?.invoice_no || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Place of Supply</p>
                <p className="text-sm">{note.place_of_supply || "N/A"}</p>
              </div>
            </div>
          </div>

          <hr className="my-6" />

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <div className="mb-3">
                <p className="text-sm text-muted-foreground">P.O. No.</p>
                <p className="text-sm">{note.P_O_no || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Our Ref.</p>
                <p className="text-sm">{note.reference || "N/A"}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vessel Name</p>
              <p className="text-sm">{note.vessel?.name || "N/A"}</p>
            </div>
          </div>

          <hr className="my-6" />

          {/* Items Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="px-4 py-3 text-left font-bold">Sr. No.</th>
                  <th className="px-4 py-3 text-left font-bold">Description of Product/Service(s)</th>
                  <th className="px-4 py-3 text-right font-bold">Qty</th>
                  <th className="px-4 py-3 text-right font-bold">Unit Price (₹)</th>
                  <th className="px-4 py-3 text-right font-bold">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {note.items?.map((item: { id: string; description: string; quantity: number; rate: string }, index: number) => {
                  const itemAmount = Number.parseFloat(item.rate) * item.quantity
                  return (
                    <tr key={item.id} className="border-b border-border">
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3">{item.description}</td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">
                        {Number.parseFloat(item.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {itemAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )
                })}
                <tr className="border-t-2 border-border font-bold">
                  <td colSpan={4} className="px-4 py-3 text-right">
                    Total Amount:
                  </td>
                  <td className="px-4 py-3 text-right text-lg">
                    ₹ {totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Link href="/sales/creditnote">
            <Button variant="outline">Back</Button>
          </Link>
          <Link href={`/sales/creditnote/${note.id}/edit`}>
            <Button>Edit Credit Note</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
