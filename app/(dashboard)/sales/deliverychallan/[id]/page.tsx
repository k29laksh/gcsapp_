"use client"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Edit, Printer, Trash2 } from "lucide-react"
import { useGetSingleDeliveryChallanQuery, useDeleteDeliveryChallanMutation } from "@/redux/Service/delivery-challan"
import { useToast } from "@/hooks/use-toast"

interface DeliveryItem {
  description: string
  quantity: number
  unit_wt: string
  box_wt: string
  box_no: string
  remarks?: string
}

export default function DeliveryChallanDetail() {
  const params = useParams()
  const router = useRouter()
  const challanId = params.id as string
  const { toast } = useToast()

  // Fetch delivery challan details
  const { data: challan, isLoading, isError } = useGetSingleDeliveryChallanQuery(challanId)
  const [deleteDeliveryChallan] = useDeleteDeliveryChallanMutation()

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this delivery challan? This action cannot be undone.")) {
      try {
        await deleteDeliveryChallan(challanId).unwrap()
        toast({
          title: "Success",
          description: "Delivery challan deleted successfully",
        })
        router.push("/sales/deliverychallan")
      } catch {
        toast({
          title: "Error",
          description: "Failed to delete delivery challan",
          variant: "destructive",
        })
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading delivery challan details...</div>
      </div>
    )
  }

  if (isError || !challan) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-lg text-red-600">Failed to load delivery challan details</div>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Delivery Challan Details</h1>
            <p className="text-sm text-muted-foreground">
              Delivery Note: {challan.delivery_note_no}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/sales/deliverychallan/${challanId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="font-medium">{challan.order_no}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order Date</p>
              <p className="font-medium">
                {new Date(challan.order_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Delivery Note Number</p>
              <p className="font-medium">{challan.delivery_note_no}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dispatch Date</p>
              <p className="font-medium">
                {new Date(challan.dispatch_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Delivery Method</p>
              <p className="font-medium">{challan.delivery_method}</p>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Customer Name</p>
              <p className="font-medium">{challan.customer?.contacts[0].first_name  || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer designation</p>
              <p className="font-medium">{challan.customer?.contacts[0].designation || "N/A"}</p>
            </div>
            {challan.customer?.contacts && challan.customer.contacts.length > 0 && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{challan.customer.contacts[0].email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{challan.customer.contacts[0].phone || "N/A"}</p>
                </div>
              </>
            )}
            {challan.customer?.addresses && challan.customer.addresses.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">
                  {challan.customer.addresses[0].address_line1}
                  {challan.customer.addresses[0].address_line2 && `, ${challan.customer.addresses[0].address_line2}`}
                  <br />
                  {challan.customer.addresses[0].city}, {challan.customer.addresses[0].state} {challan.customer.addresses[0].postal_code}
                  <br />
                  {challan.customer.addresses[0].country}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invoice Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Invoice Number</p>
              <p className="font-medium">{challan.invoice?.invoice_no || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Invoice Date</p>
              <p className="font-medium">
                {challan.invoice?.invoice_date 
                  ? new Date(challan.invoice.invoice_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-medium text-lg">
                ${challan.invoice?.total_amount ? Number(challan.invoice.total_amount).toFixed(2) : "0.00"}
              </p>
            </div>
            {challan.invoice?.items && challan.invoice.items.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="font-medium">{challan.invoice.items.length}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delivery Items */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Description</th>
                  <th className="text-right py-3 px-2">Quantity</th>
                  <th className="text-right py-3 px-2">Unit Wt.</th>
                  <th className="text-right py-3 px-2">Box Wt.</th>
                  <th className="text-right py-3 px-2">Box No.</th>
                  <th className="text-left py-3 px-2">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {challan.delivery_items && challan.delivery_items.length > 0 ? (
                  challan.delivery_items.map((item: DeliveryItem, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-2">{item.description}</td>
                      <td className="text-right py-3 px-2">{item.quantity}</td>
                      <td className="text-right py-3 px-2">{item.unit_wt}</td>
                      <td className="text-right py-3 px-2">{item.box_wt}</td>
                      <td className="text-right py-3 px-2">{item.box_no}</td>
                      <td className="py-3 px-2">{item.remarks || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No delivery items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}