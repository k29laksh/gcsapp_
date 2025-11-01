"use client"

import { notFound } from "next/navigation"
import { EmployeeForm } from "@/components/employee-form"
import { PageHeader } from "@/components/ui/page-header"
import { useGetSingleEmployeeQuery } from "@/redux/Service/employee"

interface EditEmployeePageProps {
  params: {
    id: string
  }
}

export default function EditEmployeePage({ params }: EditEmployeePageProps) {
  // ✅ RTK Query for single employee
  const { data, isLoading, isError } = useGetSingleEmployeeQuery(params.id)

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (isError || !data) {
    notFound()
    return null
  }

  // ✅ Extract first/last name from backend `name`
  const [firstName, ...lastNameParts] = data.name.split(" ")
  const lastName = lastNameParts.join(" ")

  // ✅ Map backend → frontend fields
  const mappedEmployee = {
    id: data.id,
    firstName,
    lastName,
    email: data.email,
    jobTitle: data.job_title,
    department: data.department_name,
    employmentType: data.employment_type,
    basicSalary: data.basic_salary,
    hourlyRate: data.hourly_rate,
    reportingManager: data.reporting_manager,
    phoneNumber: data.phone_number,
    address: data.address,
  }

  const breadcrumbs = [
    { label: "HR", href: "/hr" },
    { label: "Employee Management", href: "/hr/employees" },
    { label: "Edit Employee" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Employee"
        description="Update employee information"
        breadcrumbs={breadcrumbs}
      />
      <EmployeeForm employee={mappedEmployee} isEditing={true} />
    </div>
  )
}
