// app/hr/attendance/[id]/edit/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { AttendanceForm } from "@/components/attendance-form"
import { PageHeader } from "@/components/ui/page-header"
import { useToast } from "@/hooks/use-toast"
import { useGetSingleAttendanceQuery }  from "@/redux/Service/attendance"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function EditAttendancePage() {
  const params = useParams()
  const { toast } = useToast()
  const attendanceId = params.id as string

  const { data: attendanceData, isLoading, error } = useGetSingleAttendanceQuery(attendanceId)

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load attendance details",
        variant: "destructive",
      })
    }
  }, [error, toast])

  const breadcrumbs = [
    { label: "HR", href: "/hr" },
    { label: "Attendance Management", href: "/hr/attendance" },
    { label: "Edit Attendance" },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Attendance" description="Update attendance record" breadcrumbs={breadcrumbs} />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Loading attendance details...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !attendanceData) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Attendance" description="Update attendance record" breadcrumbs={breadcrumbs} />
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {error ? "Failed to load attendance details." : "Attendance not found."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Attendance" description="Update attendance record" breadcrumbs={breadcrumbs} />
      <AttendanceForm attendance={attendanceData} isEditing />
    </div>
  )
}