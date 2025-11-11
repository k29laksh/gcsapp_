"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Eye, Edit, Trash2, Plus, Calendar, Clock, CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { DataTableEnhanced } from "@/components/ui/data-table-enhanced"
import { PageHeader } from "@/components/ui/page-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  useGetLeavesQuery,
  useDeleteLeaveMutation,
  useApproveLeaveMutation,
  useRejectLeaveMutation,
} from "@/redux/Service/leave"

// Interface matching your API response
interface Leave {
  id: string
  employee: string // This is the employee UUID
  start_date: string
  end_date: string
  reason: string
  contact: string
  emergency_contact: string
  type: string
  // You might need to add these fields or map them
  status?: string
  createdAt?: string
  employee_details?: {
    name: string,
   job_title: string
  }
}

// Transformed interface for the table
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
   name: string,
   job_title: string
  }
}

interface LeaveStats {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
}

export default function LeavePage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // RTK Query hooks
  const { 
    data: leavesData, 
    isLoading, 
    error, 
    refetch 
  } = useGetLeavesQuery()
  
  const [deleteLeave] = useDeleteLeaveMutation()
  const [approveLeave] = useApproveLeaveMutation()
  const [rejectLeave] = useRejectLeaveMutation()

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([])
  const [stats, setStats] = useState<LeaveStats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  // Transform API data to match your component's expected format
  useEffect(() => {
    if (leavesData) {
      const transformedData = transformLeavesData(leavesData)
      setLeaveRequests(transformedData)
      calculateStats(transformedData)
    }
  }, [leavesData])

  useEffect(() => {
    filterRequests()
  }, [leaveRequests, searchTerm, statusFilter, typeFilter])

  // Transform the API response to match your component's expected format
  const transformLeavesData = (leaves: Leave[]): LeaveRequest[] => {
    return leaves.map(leave => {
      // Calculate total days
      const start = new Date(leave.start_date)
      const end = new Date(leave.end_date)
      const timeDiff = end.getTime() - start.getTime()
      const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1 // +1 to include both start and end dates

      // You'll need to fetch employee details separately or ensure they're included in the response
        // For now, using placeholder data
        const employeeDetails = {
          name: leave.employee.name,
          job_title: leave.employee.job_title
        }

      return {
        id: leave.id,
        leaveType: leave.type,
        startDate: leave.start_date,
        endDate: leave.end_date,
        totalDays,
        reason: leave.reason,
        status: leave.status || "PENDING", // Default to PENDING if status not provided
        createdAt: leave.createdAt || leave.start_date, // Use start_date as fallback
        employee: employeeDetails
      }
    })
  }

  const calculateStats = (data: LeaveRequest[]) => {
    const stats = {
      totalRequests: data.length,
      pendingRequests: data.filter((req) => req.status === "PENDING").length,
      approvedRequests: data.filter((req) => req.status === "APPROVED").length,
      rejectedRequests: data.filter((req) => req.status === "REJECTED").length,
    }
    setStats(stats)
  }

  const filterRequests = () => {
    let filtered = leaveRequests

    if (searchTerm) {
      filtered = filtered.filter(
        (request) =>
          `${request.employee.firstName} ${request.employee.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          request.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.reason.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((request) => request.status === statusFilter)
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((request) => request.leaveType === typeFilter)
    }

    setFilteredRequests(filtered)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this leave request?")) return

    try {
      await deleteLeave(id).unwrap()
      toast({
        title: "Success",
        description: "Leave request deleted successfully",
      })
      // No need to manually refetch - RTK Query will invalidate cache and refetch
    } catch (error) {
      console.error("Error deleting leave request:", error)
      toast({
        title: "Error",
        description: "Failed to delete leave request",
        variant: "destructive",
      })
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await approveLeave(id).unwrap()
      toast({
        title: "Success",
        description: "Leave request approved successfully",
      })
    } catch (error) {
      console.error("Error approving leave request:", error)
      toast({
        title: "Error",
        description: "Failed to approve leave request",
        variant: "destructive",
      })
    }
  }

  const handleReject = async (id: string) => {
    try {
      await rejectLeave(id).unwrap()
      toast({
        title: "Success",
        description: "Leave request rejected",
      })
    } catch (error) {
      console.error("Error rejecting leave request:", error)
      toast({
        title: "Error",
        description: "Failed to reject leave request",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { variant: "outline", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      APPROVED: { variant: "default", className: "bg-green-100 text-green-800 border-green-300" },
      REJECTED: { variant: "destructive", className: "bg-red-100 text-red-800 border-red-300" },
      CANCELLED: { variant: "secondary", className: "bg-gray-100 text-gray-800 border-gray-300" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING

    return <Badge className={config.className}>{status.replace("_", " ")}</Badge>
  }

  const columns: ColumnDef<LeaveRequest>[] = [
    {
      accessorKey: "employee",
      header: "Employee",
      cell: ({ row }) => {
        const employee = row.getValue("employee") as LeaveRequest["employee"]
        return (
          <div>
            <div className="font-medium">
              {employee.name}
            </div>
            <div className="text-sm text-muted-foreground">
              {employee.job_title}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "leaveType",
      header: "Leave Type",
      cell: ({ row }) => {
        const type = row.getValue("leaveType") as string
        return <Badge variant="outline">{type.replace(/_/g, " ")}</Badge>
      },
    },
    {
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ row }) => new Date(row.getValue("startDate")).toLocaleDateString(),
    },
    {
      accessorKey: "endDate",
      header: "End Date",
      cell: ({ row }) => new Date(row.getValue("endDate")).toLocaleDateString(),
    },
    {
      accessorKey: "totalDays",
      header: "Days",
      cell: ({ row }) => <div className="text-center font-medium">{row.getValue("totalDays")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "createdAt",
      header: "Applied On",
      cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const leaveRequest = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/hr/leave/${leaveRequest.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {leaveRequest.status === "PENDING" && (
                <DropdownMenuItem onClick={() => router.push(`/hr/leave/${leaveRequest.id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {leaveRequest.status === "PENDING" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleApprove(leaveRequest.id)} className="text-green-600">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleReject(leaveRequest.id)} className="text-red-600">
                    <X className="mr-2 h-4 w-4" />
                    Reject
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDelete(leaveRequest.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const breadcrumbs = [{ label: "HR", href: "/hr" }, { label: "Leave Management" }]

  // Handle API error
  if (error) {
    toast({
      title: "Error",
      description: "Failed to load leave requests",
      variant: "destructive",
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        description="Manage employee leave requests and approvals"
        breadcrumbs={breadcrumbs}
        action={
          <Button onClick={() => router.push("/hr/leave/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Apply for Leave
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">All time requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approvedRequests}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <X className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejectedRequests}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by employee name, ID, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                <SelectItem value="Personal Leave">Personal Leave</SelectItem>
                <SelectItem value="Maternity Leave">Maternity Leave</SelectItem>
                <SelectItem value="Paternity Leave">Paternity Leave</SelectItem>
                <SelectItem value="Unpaid Leave">Unpaid Leave</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Requests ({filteredRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableEnhanced
            columns={columns}
            data={filteredRequests}
            searchKey="employee"
            searchPlaceholder="Search leave requests..."
            loading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}