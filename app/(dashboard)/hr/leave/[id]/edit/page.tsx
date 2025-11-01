"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { LeaveRequestForm } from "@/components/leave-request-form"
import { PageHeader } from "@/components/ui/page-header"
import { useToast } from "@/hooks/use-toast"
import { useGetSingleLeaveQuery } from "@/redux/Service/leave"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function EditLeaveRequestPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const leaveId = params.id as string

  const { 
    data: leaveData, 
    isLoading, 
    error,
    refetch 
  } = useGetSingleLeaveQuery(leaveId)

  const [leaveRequest, setLeaveRequest] = useState<any>(null)

  useEffect(() => {
    if (leaveData) {
      // Transform the API data to match the form's expected format
      const transformedData = {
        id: leaveData.id,
        employeeId: leaveData.employee,
        leaveType: leaveData.type.toUpperCase().replace(' ', '_'),
        startDate: new Date(leaveData.start_date),
        endDate: new Date(leaveData.end_date),
        reason: leaveData.reason,
        contactDetails: leaveData.contact,
        emergencyContact: leaveData.emergency_contact,
        status: leaveData.status || "PENDING"
      }
      setLeaveRequest(transformedData)
    }
  }, [leaveData])

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load leave request details",
        variant: "destructive",
      })
    }
  }, [error, toast])

  const breadcrumbs = [
    { label: "HR", href: "/hr" },
    { label: "Leave Management", href: "/hr/leave" },
    { label: "Edit Leave Request" },
  ]

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Leave Request" description="Update leave request details" breadcrumbs={breadcrumbs} />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Loading leave request details...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error || !leaveRequest) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Leave Request" description="Update leave request details" breadcrumbs={breadcrumbs} />
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {error ? "Failed to load leave request details." : "Leave request not found."}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => refetch()}>
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => router.push("/hr/leave")}>
                  Back to Leave Management
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Leave Request" description="Update leave request details" breadcrumbs={breadcrumbs} />
      <LeaveRequestForm leaveRequest={leaveRequest} isEditing />
    </div>
  )
}