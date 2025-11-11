"use client"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import DeliveryChallanForm from "@/components/deliveryChallan-form"
import { useGetSingleDeliveryChallanQuery } from "@/redux/Service/delivery-challan"

export default function EditDeliveryChallan() {
  const params = useParams()
  const router = useRouter()
  const challanId = params.id as string

  // Fetch delivery challan details
  const { data: challan, isLoading, isError } = useGetSingleDeliveryChallanQuery(challanId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading delivery challan...</div>
      </div>
    )
  }

  if (isError || !challan) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-lg text-red-600">Failed to load delivery challan</div>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Delivery Challan</h1>
          <p className="text-sm text-muted-foreground">
            Delivery Note: {challan.delivery_note_no}
          </p>
        </div>
      </div>

      <DeliveryChallanForm 
        initialData={{
          order_no: challan.order_no,
          order_date: challan.order_date,
          delivery_note_no: challan.delivery_note_no,
          invoice_id: challan.invoice_id,
          dispatch_date: challan.dispatch_date,
          delivery_method: challan.delivery_method,
          customer_id: challan.customer_id,
          delivery_items: challan.delivery_items || [],
        }}
        challanId={challanId}
      />
    </div>
  )
}
