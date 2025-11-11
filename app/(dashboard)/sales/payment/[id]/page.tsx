"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Edit, Printer, Trash2 } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useGetSinglePaymentQuery, useDeletePaymentMutation } from "@/redux/Service/payment"
import { useToast } from "@/hooks/use-toast"

export default function PaymentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const paymentId = params.id as string
  const { toast } = useToast()
  
  const { data: payment, isLoading, error } = useGetSinglePaymentQuery(paymentId)
  const [deletePayment] = useDeletePaymentMutation()

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this payment? This action cannot be undone.")) {
      try {
        await deletePayment(paymentId).unwrap()
        toast({
          title: "Success",
          description: "Payment deleted successfully",
        })
        router.push("/sales/payment")
      } catch {
        toast({
          title: "Error",
          description: "Failed to delete payment",
          variant: "destructive",
        })
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", { 
      day: "2-digit", 
      month: "short", 
      year: "numeric" 
    })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
    }
    return colors[status.toLowerCase()] || "bg-gray-100 text-gray-800"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
        <Card className="w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Loading payment details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
        <Card className="w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Payment not found</p>
            <Link href="/sales/payment">
              <Button variant="outline" className="w-full bg-transparent">
                Back to Payments
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <Link href="/sales/payment" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Payments
      </Link>

      <div className="mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{payment.receipt_no}</h1>
            <p className="text-sm text-muted-foreground mt-1">Payment Receipt Details</p>
          </div>
          <div className="flex gap-2 flex-col sm:flex-row">
            <Button variant="outline" className="gap-2 bg-transparent" onClick={() => window.print()}>
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Link href={`/sales/payment/${payment.id}/edit`}>
              <Button className="gap-2 w-full">
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

        {/* Status and Key Info */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusColor(payment.status)}`}>
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Amount</p>
                <p className="text-lg font-bold">
                  ₹{Number.parseFloat(payment.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Payment Date</p>
                <p className="text-lg font-bold">{formatDate(payment.payment_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                <p className="text-lg font-bold">{payment.method}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receipt Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Receipt Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Receipt Number</p>
                <p className="font-semibold">{payment.receipt_no}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Invoice Number</p>
                <p className="font-semibold">{payment.invoice?.invoice_no || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reference Number</p>
                <p className="font-semibold">{payment.reference_no}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Transaction ID</p>
                <p className="font-semibold">{payment.transaction_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-semibold">{payment.method}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Date</p>
                <p className="font-semibold">{formatDate(payment.payment_date)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Customer Name</p>
                <p className="font-semibold">
                  {payment.customer?.contacts?.[0] 
                    ? `${payment.customer.contacts[0].first_name} ${payment.customer.contacts[0].last_name}`
                    : "N/A"
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="font-semibold">{payment.customer?.company_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Designation</p>
                <p className="font-semibold">
                  {payment.customer?.contacts?.[0]?.designation || "N/A"}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-semibold">
                  {payment.customer?.contacts?.[0]?.email || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-semibold">
                  {payment.customer?.contacts?.[0]?.phone || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">GST Number</p>
                <p className="font-semibold">{payment.customer?.gst_number || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Details */}
        {payment.invoice && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="font-semibold">{payment.invoice.invoice_no}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Date</p>
                  <p className="font-semibold">{formatDate(payment.invoice.invoice_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-semibold">{formatDate(payment.invoice.due_date)}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-semibold">
                    ₹{Number.parseFloat(payment.invoice.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Status</p>
                  <p className="font-semibold">{payment.invoice.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">PO Number</p>
                  <p className="font-semibold">{payment.invoice.po_no || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {payment.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{payment.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
