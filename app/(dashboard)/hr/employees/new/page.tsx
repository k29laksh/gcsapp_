import { EmployeeForm } from "@/components/employee-form"
import { PageHeader } from "@/components/ui/page-header"

export default function NewEmployeePage() {
  const breadcrumbs = [
    { label: "HR", href: "/hr" },
    { label: "Employee Management", href: "/hr/employees" },
    { label: "Add Employee" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Add New Employee" description="Create a new employee record" breadcrumbs={breadcrumbs} />
      <EmployeeForm />
    </div>
  )
}

