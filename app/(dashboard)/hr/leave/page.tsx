"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Plus, Edit, Trash2, Eye, CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  useGetLeavesQuery,
  useDeleteLeaveMutation,
  useApproveLeaveMutation,
  useRejectLeaveMutation,
} from "@/redux/Service/leave"

interface Leave {
  id: string
  employee: string
  start_date: string
  end_date: string
  reason: string
  contact: string
  emergency_contact: string
  type: string
  status?: string
  createdAt?: string
  employee_details?: {
    name: string
    job_title: string
  }
}

interface LeaveRequest {
  id: string
  leaveType: string
  startDate: string
  endDate: string
  totalDays: number
  reason: string
  status: string
  createdAt: string
  employee: {
    name: string
    job_title: string
  }
}

export default function LeavePage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // RTK Query hooks
  const { 
    data: leavesData = [], 
    isLoading, 
    error
  } = useGetLeavesQuery()
  
  const [deleteLeave] = useDeleteLeaveMutation()
  const [approveLeave] = useApproveLeaveMutation()
  const [rejectLeave] = useRejectLeaveMutation()

  // Transform API data
  const preparedData = useMemo(() => {
    if (!leavesData) return []

    return leavesData.map((leave: Leave) => {
      const start = new Date(leave.start_date)
      const end = new Date(leave.end_date)
      const timeDiff = end.getTime() - start.getTime()
      const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1

      return {
        id: leave.id,
        leaveType: leave.type,
        startDate: leave.start_date,
        endDate: leave.end_date,
        totalDays,
        reason: leave.reason,
        status: leave.status || "PENDING",
        createdAt: leave.createdAt || leave.start_date,
        employee: leave.employee || { name: "Unknown", job_title: "N/A" }
      }
    })
  }, [leavesData])

  const handleDelete = async (id: string) => {
    try {
      await deleteLeave(id).unwrap()
      toast({
        title: "Success",
        description: "Leave request deleted successfully",
      })
    } catch (error: any) {
      console.error("Error deleting leave request:", error)
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to delete leave request",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await approveLeave(id).unwrap()
      toast({
        title: "Success",
        description: "Leave request approved successfully",
      })
    } catch (error: any) {
      console.error("Error approving leave request:", error)
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to approve leave request",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleReject = async (id: string) => {
    try {
      await rejectLeave(id).unwrap()
      toast({
        title: "Success",
        description: "Leave request rejected",
      })
    } catch (error: any) {
      console.error("Error rejecting leave request:", error)
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to reject leave request",
        variant: "destructive",
      })
      throw error
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      APPROVED: { className: "bg-green-100 text-green-800 border-green-300" },
      REJECTED: { className: "bg-red-100 text-red-800 border-red-300" },
      CANCELLED: { className: "bg-gray-100 text-gray-800 border-gray-300" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    return <Badge className={config.className}>{status.replace("_", " ")}</Badge>
  }

  // Define columns for DataTable
  const columns = [
    {
      key: "employee",
      label: "Employee",
      sortable: true,
      render: (value: any, item: any) => (
        <div>
          <div className="font-medium text-gray-900">
            {item.employee.name}
          </div>
          <div className="text-sm text-gray-500">
            {item.employee.job_title}
          </div>
        </div>
      ),
    },
    {
      key: "leaveType",
      label: "Leave Type",
      sortable: true,
      render: (value: any) => <Badge variant="outline">{value.replace(/_/g, " ")}</Badge>,
    },
    {
      key: "startDate",
      label: "Start Date",
      sortable: true,
      render: (value: any) => new Date(value).toLocaleDateString("en-IN"),
    },
    {
      key: "endDate",
      label: "End Date",
      sortable: true,
      render: (value: any) => new Date(value).toLocaleDateString("en-IN"),
    },
    {
      key: "totalDays",
      label: "Days",
      sortable: true,
      render: (value: any) => <div className="text-center font-medium">{value}</div>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: any, item: any) => getStatusBadge(item.status),
    },
    {
      key: "createdAt",
      label: "Applied On",
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
      href: (item: any) => `/hr/leave/${item.id}`,
    },
    {
      type: "edit" as const,
      label: "Edit",
      icon: <Edit className="h-4 w-4" />,
      href: (item: any) => `/hr/leave/${item.id}/edit`,
      condition: (item: any) => item.status === "PENDING",
    },
    {
      type: "custom" as const,
      label: "Approve",
      icon: <CheckCircle className="h-4 w-4" />,
      onClick: async (item: any, e: React.MouseEvent) => {
        await handleApprove(item.id)
      },
      condition: (item: any) => item.status === "PENDING",
    },
    {
      type: "custom" as const,
      label: "Reject",
      icon: <X className="h-4 w-4" />,
      onClick: async (item: any, e: React.MouseEvent) => {
        await handleReject(item.id)
      },
      condition: (item: any) => item.status === "PENDING",
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
        { value: "PENDING", label: "Pending" },
        { value: "APPROVED", label: "Approved" },
        { value: "REJECTED", label: "Rejected" },
        { value: "CANCELLED", label: "Cancelled" },
      ],
    },
    {
      key: "leaveType",
      label: "Leave Type",
      type: "select" as const,
      options: [
        { value: "Annual Leave", label: "Annual Leave" },
        { value: "Sick Leave", label: "Sick Leave" },
        { value: "Personal Leave", label: "Personal Leave" },
        { value: "Maternity Leave", label: "Maternity Leave" },
        { value: "Paternity Leave", label: "Paternity Leave" },
        { value: "Unpaid Leave", label: "Unpaid Leave" },
        { value: "Other", label: "Other" },
      ],
    },
  ]

  // Mobile card renderer
  const renderMobileCard = (item: any) => (
    <div key={item.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2">
          <div>
            <p className="font-semibold text-gray-900">{item.employee.name}</p>
            <p className="text-sm text-gray-500">{item.employee.job_title}</p>
          </div>
        </div>
        {getStatusBadge(item.status)}
      </div>
      <div className="text-sm text-gray-600 space-y-1 mb-3">
        <p><span className="font-medium">Type:</span> {item.leaveType.replace(/_/g, " ")}</p>
        <p><span className="font-medium">Period:</span> {new Date(item.startDate).toLocaleDateString("en-IN")} - {new Date(item.endDate).toLocaleDateString("en-IN")}</p>
        <p><span className="font-medium">Days:</span> {item.totalDays}</p>
        <p><span className="font-medium">Applied:</span> {new Date(item.createdAt).toLocaleDateString("en-IN")}</p>
        <p><span className="font-medium">Reason:</span> {item.reason}</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {actions
          .filter(action => !action.condition || action.condition(item))
          .map((action, index) => (
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
    <div className="space-y-6">
      

      {/* DataTable */}
      <DataTable
        data={preparedData}
        columns={columns}
        actions={actions}
        filters={filters}
        searchable={true}
        sortable={true}
        createButton={{
          label: "Apply for Leave",
          href: "/hr/leave/new",
        }}
        title="Leave Requests"
        description="View and manage all employee leave requests"
        isLoading={isLoading}
        error={error}
        onDelete={handleDelete}
        emptyMessage="No leave requests found. Apply for your first leave to get started."
        renderMobileCard={renderMobileCard}
      />
    </div>
  )
}