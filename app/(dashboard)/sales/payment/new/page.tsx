import PaymentForm from "@/components/payment-form";
import { CardHeader, CardTitle } from "@/components/ui/card";

export default function NewPaymentPage() {
  return (
    <div className="">
      <div className="mx-auto">
        <CardHeader className="px-0">
          <CardTitle className="text-3xl">Add Payment</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">Add new payment details</p>
        </CardHeader>

        <PaymentForm />
      </div>
    </div>
  )
}
