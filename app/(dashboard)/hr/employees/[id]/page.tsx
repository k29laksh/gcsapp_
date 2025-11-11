"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { 
  ArrowLeft, 
  Pencil, 
  Loader2, 
  User, 
  MapPin, 
  Calendar, 
  Trash,
  Mail,
  Phone,
  FileText,
  Briefcase,
  Award,
  Clock,
  Clipboard,
  IndianRupee
} from "lucide-react"
import { useGetSingleEmployeeQuery, useDeleteEmployeeMutation } from "@/redux/Service/employee"

// Add AlertDialog import
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

interface EmployeePageProps {
  params: {
    id: string
  }
}

export default function EmployeePage({ params }: EmployeePageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { data: employee, isLoading, error } = useGetSingleEmployeeQuery(params.id)
  const [deleteEmployee, { isLoading: isDeleting }] = useDeleteEmployeeMutation()

  console.log("Employee Data:", employee)

  const handleDeleteEmployee = async () => {
    try {
      await deleteEmployee(params.id).unwrap()

      toast({
        title: "Success",
        description: "Employee deleted successfully",
      })

      router.push("/hr/employees")
      router.refresh()
    } catch (error) {
      console.error("Error deleting employee:", error)
      toast({
        title: "Error",
        description: "Failed to delete employee. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Button variant="outline" onClick={() => router.push("/hr/employees")} className="mb-4 sm:mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="md:col-span-2 h-64 bg-gray-200 rounded"></div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Button variant="outline" onClick={() => router.push("/hr/employees")} className="mb-4 sm:mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="mt-8 text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-red-600">Employee Not Found</h1>
          </div>
        </div>
      </div>
    )
  }

  const getInitials = (name: string) => {
    if (!name) return "??"
    const [firstName, ...lastNameParts] = name.split(" ")
    const lastName = lastNameParts.join(" ")
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
  }

  const getStatusBadge = (status: string) => {
    let color = ""
    let displayStatus = status

    switch (status?.toUpperCase()) {
      case "ACTIVE":
        color = "bg-green-100 text-green-800 border-green-200"
        displayStatus = "Active"
        break
      case "INACTIVE":
        color = "bg-gray-100 text-gray-800 border-gray-200"
        displayStatus = "Inactive"
        break
      case "ON_LEAVE":
        color = "bg-yellow-100 text-yellow-800 border-yellow-200"
        displayStatus = "On Leave"
        break
      case "TERMINATED":
        color = "bg-red-100 text-red-800 border-red-200"
        displayStatus = "Terminated"
        break
      default:
        color = "bg-gray-100 text-gray-800 border-gray-200"
        displayStatus = status || "Unknown"
    }

    return <Badge className={color}>{displayStatus}</Badge>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Button variant="outline" onClick={() => router.push("/hr/employees")} className="w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              size="sm" 
              asChild
              className="flex-1 sm:flex-none"
            >
              <Link href={`/hr/employees/${employee.id}/edit`}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </Button>
            {/* Delete Button with AlertDialog */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="flex-1 sm:flex-none text-white">
                  <Trash className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the employee 
                    "{employee.name}" and remove all their data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteEmployee}
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
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                  <AvatarImage src="/placeholder.svg" alt={employee.name} />
                  <AvatarFallback className="text-lg">{getInitials(employee.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl sm:text-2xl md:text-3xl truncate flex items-center gap-2">
                    <User className="h-6 w-6 text-blue-600" />
                    {employee.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    {employee.job_title || "Job title not specified"}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(employee.status)}
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-sm sm:text-base px-3 py-1 whitespace-nowrap flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {employee.employment_type || "Employee"}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Basic Information */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Employee ID</p>
                <p className="font-semibold text-sm sm:text-base">{employee.id || "N/A"}</p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Department</p>
                <p className="font-semibold text-sm sm:text-base">{employee.department_name || "N/A"}</p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Employment Type</p>
                <p className="font-semibold text-sm sm:text-base">{employee.employment_type || "N/A"}</p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Joining Date</p>
                <p className="font-semibold text-sm sm:text-base flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {employee.date_of_joining ? new Date(employee.date_of_joining).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Manager</p>
                <p className="font-semibold text-sm sm:text-base">
                  {employee.managers?.[0]?.name || "None"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Address Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Contact Information */}
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-600" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                  <p className="text-xs sm:text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-sm sm:text-base flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {employee.email || "N/A"}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                  <p className="text-xs sm:text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-sm sm:text-base flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {employee.phone_number || "Not provided"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-600" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                  <p className="text-xs sm:text-sm text-gray-600">Address</p>
                  <p className="font-semibold text-sm sm:text-base">
                    {employee.address || "Not provided"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Information */}
        <Card className="mt-4 sm:mt-6">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-gray-600" />
              Financial Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Basic Salary</p>
                <p className="font-semibold text-sm sm:text-base flex items-center gap-1">
                  
                  {employee.basic_salary ? `₹${parseFloat(employee.basic_salary).toLocaleString('en-IN')}` : "Not provided"}
                </p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Hourly Rate</p>
                <p className="font-semibold text-sm sm:text-base flex items-center gap-1">
                  
                  {employee.hourly_rate ? `₹${parseFloat(employee.hourly_rate).toLocaleString('en-IN')}/hr` : "Not provided"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        

        {/* Manager Information */}
        {employee.managers && employee.managers.length > 0 && (
          <Card className="mt-4 sm:mt-6">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Reporting Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {employee.managers.map((manager: any) => (
                  <div key={manager.id} className="bg-gray-50 p-3 sm:p-4 rounded border">
                    <p className="text-xs sm:text-sm text-gray-600">Manager Name</p>
                    <p className="font-semibold text-sm sm:text-base">{manager.name}</p>
                    <p className="text-xs text-gray-600 mt-1">{manager.job_title}</p>
                    <p className="text-xs text-gray-600">{manager.email}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}