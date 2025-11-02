// components/attendance-form.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  useAddAttendanceMutation,
  useUpdateAttendanceMutation,
} from "@/redux/Service/attendance"
import { useGetEmployeeQuery } from "@/redux/Service/employee"

// Updated form schema to match your API requirements
const formSchema = z.object({
  employee: z.string().min(1, "Employee is required"),
  date: z.date({ required_error: "Date is required" }),
  status: z.string().min(1, "Status is required"),
  check_in: z.string().optional(),
  check_out: z.string().optional(),
  notes: z.string().optional(),
})

type AttendanceFormValues = z.infer<typeof formSchema>

interface AttendanceFormProps {
  attendance?: any
  isEditing?: boolean
}

export function AttendanceForm({ attendance, isEditing = false }: AttendanceFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  // RTK Query hooks
  const [addAttendance, { isLoading: isAdding }] = useAddAttendanceMutation()
  const [updateAttendance, { isLoading: isUpdating }] = useUpdateAttendanceMutation()
  
  const { data: employees = [], isLoading: isLoadingEmployees } = useGetEmployeeQuery()

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employee: attendance?.employee || "",
      date: attendance?.date ? new Date(attendance.date) : new Date(),
      status: attendance?.status || "PRESENT",
      check_in: attendance?.check_in || "",
      check_out: attendance?.check_out || "",
      notes: attendance?.notes || "",
    },
  })

  const onSubmit = async (values: AttendanceFormValues) => {
    try {
      // Format the data exactly as required by the API
      const payload = {
        employee_id: values.employee,
        status: values.status,
        notes: values.notes || "",
      }

      console.log("Submitting attendance data:", payload)

      if (isEditing && attendance?.id) {
        await updateAttendance({ id: attendance.id, ...payload }).unwrap()
        toast({
          title: "Success",
          description: "Attendance updated successfully",
        })
      } else {
        await addAttendance(payload).unwrap()
        toast({
          title: "Success",
          description: "Attendance marked successfully",
        })
      }

      router.push("/hr/attendance")
      router.refresh()
    } catch (error: any) {
      console.error("Error saving attendance:", error)
      
      let errorMessage = `Failed to ${isEditing ? "update" : "mark"} attendance`
      
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
    }
  }

  const isLoading = isAdding || isUpdating

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Attendance" : "Mark Attendance"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Employee Field */}
            <FormField
              control={form.control}
              name="employee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingEmployees || isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((employee: any) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} ({employee.department_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Select the employee to mark attendance for</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Field */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          disabled={isLoading}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>The date for which attendance is being marked</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status Field */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PRESENT">Present</SelectItem>
                      <SelectItem value="ABSENT">Absent</SelectItem>
                      <SelectItem value="LATE">Late</SelectItem>
                      <SelectItem value="HALF_DAY">Half Day</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>The attendance status for the employee</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time Fields */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="check_in"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check In Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        {...field} 
                        disabled={isLoading}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>The time when the employee checked in</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="check_out"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check Out Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        {...field} 
                        disabled={isLoading}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>The time when the employee checked out</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes Field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional notes about the attendance (e.g., 'randi dustant')" 
                      className="resize-none" 
                      {...field} 
                      disabled={isLoading}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>Optional notes about the attendance record</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading || isLoadingEmployees}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Marking..."}
                  </>
                ) : (
                  isEditing ? "Update Attendance" : "Mark Attendance"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/hr/attendance")} disabled={isLoading}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
