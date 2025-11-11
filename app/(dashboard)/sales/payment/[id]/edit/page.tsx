"use client"

import { useParams } from "next/navigation"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import PaymentForm from "@/components/payment-form"
import { useGetSinglePaymentQuery } from "@/redux/Service/payment"

export default function EditPaymentPage() {
  const params = useParams()
  const paymentId = params.id as string
  
  const { data: payment, isLoading, error } = useGetSinglePaymentQuery(paymentId)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Loading payment...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Payment not found</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="">
      <div className="mx-auto">
        <CardHeader className="px-0">
          <CardTitle className="text-3xl">Edit Payment</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">Update payment details</p>
        </CardHeader>

        <PaymentForm initialData={payment} paymentId={paymentId} />
      </div>
    </div>
  )
}
