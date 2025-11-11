"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { 
  useGetSingleLeaveQuery, 
  useDeleteLeaveMutation,
  useUpdateLeaveMutation 
} from "@/redux/Service/leave"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Pencil, ArrowLeft, Loader2, User, Calendar, Clock, Phone, AlertCircle, FileText, Trash, Mail, MapPin } from "lucide-react"

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
  
  const [deleteLeave, { isLoading: isDeleting }] = useDeleteLeaveMutation()
  const [updateLeave, { isLoading: isUpdating }] = useUpdateLeaveMutation()

  const [leaveRequest, setLeaveRequest] = useState<LeaveWithEmployeeDetails | null>(null)
  const [isDeletingDialogOpen, setIsDeletingDialogOpen] = useState(false)

  useEffect(() => {
    if (leaveData) {
      // Transform the API data to include employee details
      const transformedData: LeaveWithEmployeeDetails = {
        ...leaveData,
        employee_details: {
          id: leaveData.employee,
          firstName: "Employee",
          lastName: leaveData.employee.name.slice(0, 8),
          employeeId: `EMP-${leaveData.employee.name.slice(0, 4)}`,
          position: "Staff",
          department: "Engineering",
          email: "employee@company.com",
          phone: leaveData.contact || "Not provided"
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
      PENDING: { 
        className: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: Clock
      },
      APPROVED: { 
        className: "bg-green-100 text-green-800 border-green-300",
        icon: Calendar
      },
      REJECTED: { 
        className: "bg-red-100 text-red-800 border-red-300",
        icon: AlertCircle
      },
      CANCELLED: { 
        className: "bg-gray-100 text-gray-800 border-gray-300",
        icon: AlertCircle
      },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    const IconComponent = config.icon

    return (
      <Badge 
        variant="outline" 
        className={`${config.className} flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-1 border`}
      >
        <IconComponent className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        <span className="capitalize">{status.toLowerCase()}</span>
      </Badge>
    )
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const calculateTotalDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const timeDiff = end.getTime() - start.getTime()
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1
  }

  const handleDelete = async () => {
    if (!leaveRequest) return

    try {
      await deleteLeave(leaveRequest.id).unwrap()
      toast({
        title: "Success",
        description: "Leave request deleted successfully",
      })
      setIsDeletingDialogOpen(false)
      router.push("/hr/leave")
    } catch (error) {
      console.error("Error deleting leave request:", error)
      toast({
        title: "Error",
        description: "Failed to delete leave request",
        variant: "destructive",
      })
      setIsDeletingDialogOpen(false)
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
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <Button variant="outline" onClick={() => router.push("/hr/leave")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leave Requests
          </Button>
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-48 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-48 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !leaveRequest) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <Button variant="outline" onClick={() => router.push("/hr/leave")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leave Requests
          </Button>
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-600 mb-2">Leave Request Not Found</h2>
              <p className="text-gray-600 mb-4">The requested leave request could not be loaded.</p>
              <Button onClick={() => refetch()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const totalDays = calculateTotalDays(leaveRequest.start_date, leaveRequest.end_date)

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push("/hr/leave")}
              className="h-9 w-9 p-0 sm:h-auto sm:w-auto sm:px-3"
            >
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="sm:hidden">
              {getStatusBadge(leaveRequest.status || "PENDING")}
            </div>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              size="sm" 
              onClick={handleEdit}
              className="flex-1 sm:flex-none min-w-[80px]"
            >
              <Pencil className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="sm:inline">Edit</span>
            </Button>
            <AlertDialog open={isDeletingDialogOpen} onOpenChange={setIsDeletingDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="flex-1 sm:flex-none text-white min-w-[90px]"
                >
                  <Trash className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="sm:inline">Delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the leave request
                    and all associated data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Main Header */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="hidden sm:flex">
                    {getStatusBadge(leaveRequest.status || "PENDING")}
                  </div>
                  <CardTitle className="text-xl sm:text-2xl lg:text-3xl truncate">
                    Leave Request Details
                  </CardTitle>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{leaveRequest.employee_details?.firstName} {leaveRequest.employee_details?.lastName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Submitted on {formatDate(leaveRequest.created_at || leaveRequest.start_date)}</span>
                  </div>
                </div>
              </div>
              <div className="hidden sm:flex">
                {getStatusBadge(leaveRequest.status || "PENDING")}
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Employee Information - Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-600" />
                  Employee Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-20 w-20 mb-3">
                    <AvatarImage
                      src="/placeholder.svg"
                      alt={`${leaveRequest.employee_details?.firstName} ${leaveRequest.employee_details?.lastName}`}
                    />
                    <AvatarFallback className="text-lg">
                      {leaveRequest.employee_details ? 
                        getInitials(leaveRequest.employee_details.firstName, leaveRequest.employee_details.lastName) 
                        : "EE"
                      }
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-semibold">
                    {leaveRequest.employee_details?.firstName} {leaveRequest.employee_details?.lastName}
                  </h3>
                  <p className="text-muted-foreground">{leaveRequest.employee_details?.position}</p>
                </div>

                <div className="space-y-3">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-sm text-gray-600 mb-1">Department</p>
                    <p className="font-semibold">{leaveRequest.employee_details?.department}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-sm text-gray-600 mb-1">Employee ID</p>
                    <p className="font-semibold">{leaveRequest.employee_details?.employeeId}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                    <p className="font-semibold text-sm break-all">{leaveRequest.employee_details?.email}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Phone className="h-4 w-4" />
                      Phone
                    </div>
                    <p className="font-semibold">{leaveRequest.employee_details?.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

           
          </div>

          {/* Leave Details - Main Content */}
          <div className="xl:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  Leave Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-sm text-gray-600 mb-1">Leave Type</p>
                    <p className="font-semibold text-lg">{leaveRequest.type}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-sm text-gray-600 mb-1">Total Days</p>
                    <p className="font-semibold text-lg">{totalDays} days</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-sm text-gray-600 mb-1">Start Date</p>
                    <p className="font-semibold">{formatDate(leaveRequest.start_date)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-sm text-gray-600 mb-1">End Date</p>
                    <p className="font-semibold">{formatDate(leaveRequest.end_date)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Reason for Leave
                  </h4>
                  <div className="p-4 bg-gray-50 rounded-lg border text-sm sm:text-base">
                    {leaveRequest.reason}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Phone className="h-4 w-4" />
                      Contact During Leave
                    </div>
                    <p className="font-semibold">{leaveRequest.contact || "Not provided"}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <AlertCircle className="h-4 w-4" />
                      Emergency Contact
                    </div>
                    <p className="font-semibold">{leaveRequest.emergency_contact || "Not provided"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Approval Details */}
            {(leaveRequest.status === "APPROVED" || leaveRequest.status === "REJECTED") && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">
                    {leaveRequest.status === "APPROVED" ? "Approval Details" : "Rejection Details"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src="/placeholder.svg"
                        alt={`${leaveRequest.approved_by_details?.firstName} ${leaveRequest.approved_by_details?.lastName}`}
                      />
                      <AvatarFallback>
                        {leaveRequest.approved_by_details ? 
                          getInitials(leaveRequest.approved_by_details.firstName, leaveRequest.approved_by_details.lastName)
                          : "AD"
                        }
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-lg">
                        {leaveRequest.approved_by_details ? 
                          `${leaveRequest.approved_by_details.firstName} ${leaveRequest.approved_by_details.lastName}`
                          : "Administrator"
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {leaveRequest.approved_by_details?.position}
                        {leaveRequest.approved_date && ` • ${formatDate(leaveRequest.approved_date)}`}
                      </div>
                    </div>
                  </div>

                  {leaveRequest.comments && (
                    <div>
                      <h4 className="text-sm font-medium mb-3">Comments</h4>
                      <div className="p-4 bg-gray-50 rounded-lg border text-sm sm:text-base">
                        {leaveRequest.comments}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}