// app/sales/customer/[id]/edit/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { CustomerForm } from "@/components/customer-form"
import { PageHeader } from "@/components/ui/page-header"
import { useToast } from "@/hooks/use-toast"
import { useGetSingleCustomerQuery } from "@/redux/Service/customer"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { CustomerDetails } from "@/components/customerEdit-form"

export default function EditCustomerPage() {
  const params = useParams()
  const { toast } = useToast()
  const customerId = params.id as string

  const { data: customerData, isLoading, error } = useGetSingleCustomerQuery(customerId)

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load customer details",
        variant: "destructive",
      })
    }
  }, [error, toast])

  const breadcrumbs = [
    { label: "Sales", href: "/sales" },
    { label: "Customers", href: "/sales/customer" },
    { label: "Edit Customer" },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Customer" description="Update customer information" breadcrumbs={breadcrumbs} />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Loading customer details...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !customerData) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Customer" description="Update customer information" breadcrumbs={breadcrumbs} />
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {error ? "Failed to load customer details." : "Customer not found."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Customer" description="Update customer information" breadcrumbs={breadcrumbs} />
      <CustomerDetails customer={customerData} isEditing />
    </div>
  )
}