"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Loader2 } from "lucide-react"
import { differenceInBusinessDays, addDays, format } from "date-fns"
import { 
  useAddLeaveMutation, 
  useUpdateLeaveMutation 
} from "@/redux/Service/leave"

import { useGetEmployeeQuery } from "@/redux/Service/employee"

interface LeaveRequestFormProps {
  leaveRequest?: any
  isEditing?: boolean
}

export function LeaveRequestForm({ leaveRequest, isEditing = false }: LeaveRequestFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [totalDays, setTotalDays] = useState(0)

  const [formData, setFormData] = useState({
    employeeId: leaveRequest?.employeeId || "",
    leaveType: leaveRequest?.leaveType || "ANNUAL_LEAVE",
    startDate: leaveRequest?.startDate ? new Date(leaveRequest.startDate) : new Date(),
    endDate: leaveRequest?.endDate ? new Date(leaveRequest.endDate) : new Date(),
    reason: leaveRequest?.reason || "",
    contactDetails: leaveRequest?.contactDetails || "",
    emergencyContact: leaveRequest?.emergencyContact || "",
    status: leaveRequest?.status || "PENDING",
  })

  const [addLeave, { isLoading: isAdding }] = useAddLeaveMutation()
  const [updateLeave, { isLoading: isUpdating }] = useUpdateLeaveMutation()

  // Calculate total days when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const days = differenceInBusinessDays(
        addDays(formData.endDate, 1),
        formData.startDate,
      )
      setTotalDays(days > 0 ? days : 0)
    }
  }, [formData.startDate, formData.endDate])

  // Fetch employees
  const { data: employees = [], isLoading: isLoadingEmployees, error: employeesError } = useGetEmployeeQuery({})

  // Set default employee if not editing and employees are loaded
  useEffect(() => {
    if (!isEditing && employees.length > 0 && !formData.employeeId) {
      setFormData((prev) => ({ ...prev, employeeId: employees[0].id }))
    }
  }, [employees, isEditing, formData.employeeId])

  // Handle employees error
  useEffect(() => {
    if (employeesError) {
      console.error("Error fetching employees:", employeesError)
      toast({
        title: "Error",
        description: "Failed to load employees list",
        variant: "destructive",
      })
    }
  }, [employeesError, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Map leave type to display name and API format
  const getLeaveTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      "ANNUAL_LEAVE": "Annual Leave",
      "SICK_LEAVE": "Sick Leave",
      "PERSONAL_LEAVE": "Personal Leave",
      "MATERNITY_LEAVE": "Maternity Leave",
      "PATERNITY_LEAVE": "Paternity Leave",
      "UNPAID_LEAVE": "Unpaid Leave",
      "OTHER": "Other"
    }
    return typeMap[type] || type
  }

  const getLeaveTypeValue = (label: string) => {
    const typeMap: { [key: string]: string } = {
      "Annual Leave": "Annual Leave",
      "Sick Leave": "Sick Leave",
      "Personal Leave": "Personal Leave",
      "Maternity Leave": "Maternity Leave",
      "Paternity Leave": "Paternity Leave",
      "Unpaid Leave": "Unpaid Leave",
      "Other": "Other"
    }
    return typeMap[label] || label
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validation
      if (!formData.employeeId) {
        toast({ 
          title: "Error", 
          description: "Please select an employee", 
          variant: "destructive" 
        })
        setLoading(false)
        return
      }

      if (!formData.reason.trim()) {
        toast({ 
          title: "Error", 
          description: "Please provide a reason for leave", 
          variant: "destructive" 
        })
        setLoading(false)
        return
      }

      if (formData.startDate > formData.endDate) {
        toast({ 
          title: "Error", 
          description: "End date cannot be before start date", 
          variant: "destructive" 
        })
        setLoading(false)
        return
      }

      // Prepare payload according to your API structure
      const payload = {
        employee_id: formData.employeeId,
        start_date: format(formData.startDate, "yyyy-MM-dd"),
        end_date: format(formData.endDate, "yyyy-MM-dd"),
        reason: formData.reason.trim(),
        contact: formData.contactDetails.trim(),
        emergency_contact: formData.emergencyContact.trim(),
        type: getLeaveTypeValue(formData.leaveType)
      }

      console.log("Submitting payload:", payload)

      if (isEditing && leaveRequest?.id) {
        // Update existing leave
        await updateLeave({ 
          id: leaveRequest.id, 
          ...payload 
        }).unwrap()
        
        toast({
          title: "Success",
          description: "Leave request updated successfully",
        })
      } else {
        // Create new leave
        await addLeave(payload).unwrap()
        
        toast({
          title: "Success",
          description: "Leave request created successfully",
        })
      }

      // Navigate back to leave management
      router.push("/hr/leave")
      router.refresh()

    } catch (error: any) {
      console.error("Submit error:", error)
      
      let errorMessage = `Failed to ${isEditing ? "update" : "create"} leave request`
      
      if (error?.data) {
        if (typeof error.data === 'string') {
          errorMessage = error.data
        } else if (error.data.message) {
          errorMessage = error.data.message
        } else if (error.data.detail) {
          errorMessage = error.data.detail
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const isLoading = loading || isAdding || isUpdating

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Leave Request" : "Apply for Leave"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Employee Select */}
          <div>
            <Label htmlFor="employee">Employee *</Label>
            <Select 
              value={formData.employeeId} 
              onValueChange={(value) => handleSelectChange("employeeId", value)}
              disabled={isLoadingEmployees || isEditing}
            >
              <SelectTrigger id="employee">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee: any) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}  - {employee.job_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isLoadingEmployees && (
              <p className="text-sm text-muted-foreground mt-1">Loading employees...</p>
            )}
          </div>

          {/* Leave Type */}
          <div>
            <Label htmlFor="leaveType">Leave Type *</Label>
            <Select 
              value={formData.leaveType} 
              onValueChange={(value) => handleSelectChange("leaveType", value)}
            >
              <SelectTrigger id="leaveType">
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ANNUAL_LEAVE">Annual Leave</SelectItem>
                <SelectItem value="SICK_LEAVE">Sick Leave</SelectItem>
                <SelectItem value="PERSONAL_LEAVE">Personal Leave</SelectItem>
                <SelectItem value="MATERNITY_LEAVE">Maternity Leave</SelectItem>
                <SelectItem value="PATERNITY_LEAVE">Paternity Leave</SelectItem>
                <SelectItem value="UNPAID_LEAVE">Unpaid Leave</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <DatePicker
                date={formData.startDate}
                setDate={(date) => setFormData((prev) => ({ ...prev, startDate: date || new Date() }))}
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date *</Label>
              <DatePicker
                date={formData.endDate}
                setDate={(date) => setFormData((prev) => ({ ...prev, endDate: date || new Date() }))}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Total Days */}
          <div>
            <Label htmlFor="totalDays">Total Days (excluding weekends)</Label>
            <Input 
              id="totalDays" 
              value={totalDays} 
              disabled 
            />
            <p className="text-sm text-muted-foreground mt-1">
              Calculated automatically based on selected dates
            </p>
          </div>

          {/* Reason */}
          <div>
            <Label htmlFor="reason">Reason for Leave *</Label>
            <Textarea 
              id="reason"
              name="reason" 
              value={formData.reason} 
              onChange={handleChange} 
              rows={3} 
              required 
              placeholder="e.g., Medical treatment and rest"
              disabled={isLoading}
            />
          </div>

          {/* Contact Details */}
          <div>
            <Label htmlFor="contactDetails">Contact Details</Label>
            <Input 
              id="contactDetails"
              name="contactDetails" 
              value={formData.contactDetails} 
              onChange={handleChange}
              placeholder="e.g., +91-9876543210"
              disabled={isLoading}
            />
          </div>

          {/* Emergency Contact */}
          <div>
            <Label htmlFor="emergencyContact">Emergency Contact</Label>
            <Input 
              id="emergencyContact"
              name="emergencyContact" 
              value={formData.emergencyContact} 
              onChange={handleChange}
              placeholder="e.g., Father - +91-9123456789"
              disabled={isLoading}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || isLoadingEmployees}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Submitting..."}
              </>
            ) : (
              isEditing ? "Update Request" : "Submit Request"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}