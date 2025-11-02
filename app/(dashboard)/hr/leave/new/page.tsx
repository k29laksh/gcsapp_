import { LeaveRequestForm } from "@/components/leave-request-form"
import { PageHeader } from "@/components/ui/page-header"

export default function NewLeaveRequestPage() {
  const breadcrumbs = [
    { label: "HR", href: "/hr" },
    { label: "Leave Management", href: "/hr/leave" },
    { label: "Apply for Leave" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Apply for Leave" description="Submit a new leave request" breadcrumbs={breadcrumbs} />
      <LeaveRequestForm />
    </div>
  )
}

