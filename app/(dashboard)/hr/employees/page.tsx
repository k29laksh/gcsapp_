"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Plus, Edit, Trash2, Eye } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

// RTK query hooks
import {
  useGetEmployeeQuery,
  useDeleteEmployeeMutation,
} from "@/redux/Service/employee"

export default function EmployeesPage() {
  const { toast } = useToast()

  // RTK query
  const { data: employees = [], isLoading, error } = useGetEmployeeQuery()
  const [deleteEmployee] = useDeleteEmployeeMutation()

  const handleDelete = async (id: string) => {
    try {
      await deleteEmployee(id).unwrap()
      toast({
        title: "Success",
        description: "Employee deleted successfully",
      })
    } catch (error: any) {
      console.error("Error deleting employee:", error)
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to delete employee",
        variant: "destructive",
      })
      throw error // Re-throw to let DataTable handle the error
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: "default", className: "bg-green-100 text-green-800 border-green-200" },
      inactive: { variant: "secondary", className: "bg-gray-100 text-gray-800 border-gray-200" },
      on_leave: { variant: "outline", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      terminated: { variant: "destructive", className: "bg-red-100 text-red-800 border-red-200" },
    }

    const key = status?.toLowerCase()
    const config = statusConfig[key as keyof typeof statusConfig] || statusConfig.active

    return (
      <Badge className={`capitalize ${config.className}`}>
        {status?.replace("_", " ") || "Unknown"}
      </Badge>
    )
  }

  // Define columns for DataTable
  const columns = [
    {
      key: "id",
      label: "Employee ID",
      sortable: true,
    },
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (value: any, item: any) => (
        <div>
          <div className="font-medium text-gray-900">{item.name}</div>
          <div className="text-sm text-gray-500">{item.email}</div>
        </div>
      ),
    },
    {
      key: "job_title",
      label: "Position",
      sortable: true,
    },
    {
      key: "department_name",
      label: "Department",
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: any, item: any) => getStatusBadge(item.status),
    },
    {
      key: "date_of_joining",
      label: "Joining Date",
      sortable: true,
      render: (value: any) => new Date(value).toLocaleDateString("en-IN"),
    },
  ]

  // Define actions for DataTable
  const actions = [
    {
      type: "view" as const,
      label: "View",
      icon: <Eye className="h-4 w-4" />,
      href: (item: any) => `/hr/employees/${item.id}`,
    },
    {
      type: "edit" as const,
      label: "Edit",
      icon: <Edit className="h-4 w-4" />,
      href: (item: any) => `/hr/employees/${item.id}/edit`,
    },
    {
      type: "delete" as const,
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: async (item: any, e: React.MouseEvent) => {
        await handleDelete(item.id)
      },
    },
  ]

  // Define filters for DataTable
  const filters = [
    {
      key: "status",
      label: "Status",
      type: "select" as const,
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "on_leave", label: "On Leave" },
        { value: "terminated", label: "Terminated" },
      ],
    },
    {
      key: "department_name",
      label: "Department",
      type: "select" as const,
      options: [
        ...Array.from(new Set(employees.map((emp: any) => emp.department_name).filter(Boolean))).map(dept => ({
          value: dept,
          label: dept,
        })),
      ],
    },
  ]

  // Mobile card renderer
  const renderMobileCard = (item: any) => (
    <div key={item.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2">
          <div>
            <p className="font-semibold text-gray-900">{item.name}</p>
            <p className="text-sm text-gray-500">{item.email}</p>
          </div>
        </div>
        {getStatusBadge(item.status)}
      </div>
      <div className="text-sm text-gray-600 space-y-1 mb-3">
        <p><span className="font-medium">Position:</span> {item.job_title}</p>
        <p><span className="font-medium">Department:</span> {item.department_name}</p>
        <p><span className="font-medium">Join Date:</span> {new Date(item.date_of_joining).toLocaleDateString("en-IN")}</p>
        <p><span className="font-medium">Employee ID:</span> {item.id}</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {actions.map((action, index) => (
          <Button
            key={index}
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (action.onClick) {
                action.onClick(item, e)
              } else if (action.href) {
                window.location.href = action.href(item)
              }
            }}
            className={action.type === "delete" ? "text-red-600 bg-transparent" : ""}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  )

  return (
    <DataTable
      data={employees}
      columns={columns}
      actions={actions}
      filters={filters}
      searchable={true}
      sortable={true}
      createButton={{
        label: "Add Employee",
        href: "/hr/employees/new",
      }}
      title="Employee Management"
      description="Manage your organization's employees, their details, and employment status."
      isLoading={isLoading}
      error={error}
      onDelete={handleDelete}
      emptyMessage="No employees found. Add your first employee to get started."
      renderMobileCard={renderMobileCard}
    />
  )
}