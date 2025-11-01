import { AttendanceForm } from "@/components/attendance-form"
import { PageHeader } from "@/components/ui/page-header"

export default function NewAttendancePage() {
  const breadcrumbs = [
    { label: "HR", href: "/hr" },
    { label: "Attendance Management", href: "/hr/attendance" },
    { label: "Mark Attendance" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Mark Attendance" description="Record employee attendance" breadcrumbs={breadcrumbs} />
      <AttendanceForm />
    </div>
  )
}
