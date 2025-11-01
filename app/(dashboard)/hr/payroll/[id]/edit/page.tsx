// app/hr/payroll/[id]/edit/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { PayrollForm } from "@/components/payroll-form"
import { PageHeader } from "@/components/ui/page-header"
import { useToast } from "@/hooks/use-toast"
import { useGetSinglePayrollQuery } from "@/redux/Service/payroll"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function EditPayrollPage() {
  const params = useParams()
  const { toast } = useToast()
  const payrollId = params.id as string

  const { data: payrollData, isLoading, error } = useGetSinglePayrollQuery(payrollId)

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load payroll details",
        variant: "destructive",
      })
    }
  }, [error, toast])

  const breadcrumbs = [
    { label: "HR", href: "/hr" },
    { label: "Payroll Management", href: "/hr/payroll" },
    { label: "Edit Payroll" },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Payroll" description="Update payroll information" breadcrumbs={breadcrumbs} />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Loading payroll details...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !payrollData) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Payroll" description="Update payroll information" breadcrumbs={breadcrumbs} />
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {error ? "Failed to load payroll details." : "Payroll not found."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Payroll" description="Update payroll information" breadcrumbs={breadcrumbs} />
      <PayrollForm payroll={payrollData} isEditing />
    </div>
  )
}