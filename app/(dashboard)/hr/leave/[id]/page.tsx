"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, X, Pencil, ArrowLeft, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { 
  useGetSingleLeaveQuery, 
  useApproveLeaveMutation, 
  useRejectLeaveMutation,
  useDeleteLeaveMutation 
} from "@/redux/Service/leave"

// Interface matching your API response
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
  created_at?: string
  approved_by?: string
  approved_date?: string
  comments?: string
}

// Extended interface with employee details
interface LeaveWithEmployeeDetails extends Leave {
  employee_details?: {
    id: string
    firstName: string
    lastName: string
    employeeId: string
    position: string
    department: string
    email: string
    phone: string
  }
  approved_by_details?: {
    id: string
    firstName: string
    lastName: string
    position: string
  }
}

export default function LeaveRequestPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const leaveId = params.id as string

  // RTK Query hooks
  const { 
    data: leaveData, 
    isLoading, 
    error,
    refetch 
  } = useGetSingleLeaveQuery(leaveId)
  
  const [approveLeave, { isLoading: isApproving }] = useApproveLeaveMutation()
  const [rejectLeave, { isLoading: isRejecting }] = useRejectLeaveMutation()
  const [deleteLeave, { isLoading: isDeleting }] = useDeleteLeaveMutation()

  const [leaveRequest, setLeaveRequest] = useState<LeaveWithEmployeeDetails | null>(null)

  useEffect(() => {
    if (leaveData) {
      // Transform the API data to include employee details
      // In a real app, you'd fetch employee details from your employees API
      const transformedData: LeaveWithEmployeeDetails = {
        ...leaveData,
        employee_details: {
          id: leaveData.employee,
          firstName: "Employee", // You should fetch this from your employees API
          lastName: leaveData.employee.name.slice(0, 8), // Placeholder
          employeeId: `EMP-${leaveData.employee.name.slice(0, 4)}`, // Placeholder
          position: "Staff", // Placeholder
          department: "Engineering", // Placeholder
          email: "employee@company.com", // Placeholder
          phone: leaveData.contact || "Not provided" // Placeholder
        },
        status: leaveData.status || "PENDING",
        created_at: leaveData.created_at || leaveData.start_date
      }
      setLeaveRequest(transformedData)
    }
  }, [leaveData])

  // Handle API errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load leave request details",
        variant: "destructive",
      })
    }
  }, [error, toast])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      APPROVED: { className: "bg-green-100 text-green-800 border-green-300" },
      REJECTED: { className: "bg-red-100 text-red-800 border-red-300" },
      CANCELLED: { className: "bg-gray-100 text-gray-800 border-gray-300" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING

    return <Badge className={config.className}>{status}</Badge>
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateTotalDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const timeDiff = end.getTime() - start.getTime()
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1 // +1 to include both start and end dates
  }

  const handleApprove = async () => {
    if (!leaveRequest) return

    try {
      await approveLeave(leaveRequest.id).unwrap()
      toast({
        title: "Success",
        description: "Leave request approved successfully",
      })
      // Refetch the leave data to get updated status
      refetch()
    } catch (error) {
      console.error("Error approving leave request:", error)
      toast({
        title: "Error",
        description: "Failed to approve leave request",
        variant: "destructive",
      })
    }
  }

  const handleReject = async () => {
    if (!leaveRequest) return

    try {
      await rejectLeave(leaveRequest.id).unwrap()
      toast({
        title: "Success",
        description: "Leave request rejected",
      })
      // Refetch the leave data to get updated status
      refetch()
    } catch (error) {
      console.error("Error rejecting leave request:", error)
      toast({
        title: "Error",
        description: "Failed to reject leave request",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!leaveRequest) return

    if (!confirm("Are you sure you want to delete this leave request?")) return

    try {
      await deleteLeave(leaveRequest.id).unwrap()
      toast({
        title: "Success",
        description: "Leave request deleted successfully",
      })
      router.push("/hr/leave")
    } catch (error) {
      console.error("Error deleting leave request:", error)
      toast({
        title: "Error",
        description: "Failed to delete leave request",
        variant: "destructive",
      })
    }
  }

  const handleEdit = () => {
    if (leaveRequest) {
      router.push(`/hr/leave/${leaveRequest.id}/edit`)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Loading leave request details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !leaveRequest) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/hr/leave">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h2 className="text-2xl font-bold">Leave Request Details</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {error ? "Failed to load leave request details." : "Leave request not found."}
              </p>
              <Button onClick={() => refetch()} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalDays = calculateTotalDays(leaveRequest.start_date, leaveRequest.end_date)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/hr/leave">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h2 className="text-2xl font-bold">Leave Request Details</h2>
        </div>
        <div className="flex gap-2">
          {leaveRequest.status === "PENDING" && (
            <>
              <Button 
                variant="outline" 
                onClick={handleEdit}
                disabled={isApproving || isRejecting}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button 
                variant="default" 
                className="bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                disabled={isApproving || isRejecting}
              >
                {isApproving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Approve
              </Button>
              <Button 
                variant="destructive"
                onClick={handleReject}
                disabled={isApproving || isRejecting}
              >
                {isRejecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <X className="mr-2 h-4 w-4" />
                )}
                Reject
              </Button>
            </>
          )}
          {(leaveRequest.status === "PENDING" || leaveRequest.status === "REJECTED") && (
            <Button 
              variant="outline" 
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-destructive border-destructive hover:bg-destructive hover:text-white"
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <X className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center mb-6">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src="/placeholder.svg"
                  alt={`${leaveRequest.employee_details?.firstName} ${leaveRequest.employee_details?.lastName}`}
                />
                <AvatarFallback>
                  {leaveRequest.employee_details ? 
                    getInitials(leaveRequest.employee_details.firstName, leaveRequest.employee_details.lastName) 
                    : "EE"
                  }
                </AvatarFallback>
              </Avatar>
              <h3 className="mt-4 text-xl font-semibold">
                {leaveRequest.employee_details?.firstName} {leaveRequest.employee_details?.lastName}
              </h3>
              <p className="text-muted-foreground">{leaveRequest.employee_details?.position}</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Department</div>
                <div className="text-sm">{leaveRequest.employee_details?.department}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Employee ID</div>
                <div className="text-sm">{leaveRequest.employee_details?.employeeId}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Email</div>
                <div className="text-sm">{leaveRequest.employee_details?.email}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Phone</div>
                <div className="text-sm">{leaveRequest.employee_details?.phone}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Leave Request</CardTitle>
              <div>{getStatusBadge(leaveRequest.status || "PENDING")}</div>
            </div>
            <CardDescription>
              Request submitted on {formatDate(leaveRequest.created_at || leaveRequest.start_date)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-1">Leave Type</h4>
                <p className="font-medium">{leaveRequest.type}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Total Days</h4>
                <p className="font-medium">{totalDays} days</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Start Date</h4>
                <p className="font-medium">{formatDate(leaveRequest.start_date)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">End Date</h4>
                <p className="font-medium">{formatDate(leaveRequest.end_date)}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-1">Reason for Leave</h4>
              <p className="p-3 bg-muted rounded-md">{leaveRequest.reason}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-1">Contact During Leave</h4>
                <p className="font-medium">{leaveRequest.contact || "Not provided"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Emergency Contact</h4>
                <p className="font-medium">{leaveRequest.emergency_contact || "Not provided"}</p>
              </div>
            </div>

            {(leaveRequest.status === "APPROVED" || leaveRequest.status === "REJECTED") && (
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium mb-2">
                  {leaveRequest.status === "APPROVED" ? "Approval Details" : "Rejection Details"}
                </h4>
                {leaveRequest.approved_by_details ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src="/placeholder.svg"
                        alt={`${leaveRequest.approved_by_details.firstName} ${leaveRequest.approved_by_details.lastName}`}
                      />
                      <AvatarFallback>
                        {getInitials(leaveRequest.approved_by_details.firstName, leaveRequest.approved_by_details.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {leaveRequest.approved_by_details.firstName} {leaveRequest.approved_by_details.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {leaveRequest.approved_by_details.position}
                        {leaveRequest.approved_date && ` • on ${formatDate(leaveRequest.approved_date)}`}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">Administrator</div>
                      <div className="text-xs text-muted-foreground">
                        {leaveRequest.approved_date ? `on ${formatDate(leaveRequest.approved_date)}` : "Action taken"}
                      </div>
                    </div>
                  </div>
                )}

                {leaveRequest.comments && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-1">Comments</h4>
                    <p className="p-3 bg-muted rounded-md">{leaveRequest.comments}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}