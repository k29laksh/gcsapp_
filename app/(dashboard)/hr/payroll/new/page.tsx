import { PayrollForm } from "@/components/payroll-form"
import { PageHeader } from "@/components/ui/page-header"

export default function NewPayrollPage() {
  const breadcrumbs = [
    { label: "HR", href: "/hr" },
    { label: "Payroll Management", href: "/hr/payroll" },
    { label: "Generate Payroll" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Generate Payroll" description="Create a new payroll record" breadcrumbs={breadcrumbs} />
      <PayrollForm />
    </div>
  )
}
