// components/payroll-form.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { CalendarIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAddPayrollMutation, useUpdatePayrollMutation } from "@/redux/Service/payroll"
import { useGetEmployeeQuery } from "@/redux/Service/employee"

const formSchema = z.object({
  employee: z.string({
    required_error: "Employee is required",
  }),
  date: z.date().optional(),
  basic_salary: z.coerce.number().min(0, "Basic salary must be a positive number"),
  allowances: z.coerce.number().min(0, "Allowances must be a positive number"),
  deductions: z.coerce.number().min(0, "Deductions must be a positive number"),
  status: z.enum(["pending", "paid"]),
  notes: z.string().optional(),
  transaction_id: z.string().optional(),
})

type PayrollFormValues = z.infer<typeof formSchema>

interface PayrollFormProps {
  payroll?: any
  isEditing?: boolean
}

export function PayrollForm({ payroll, isEditing = false }: PayrollFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [netSalary, setNetSalary] = useState(0)

  // RTK Query hooks
  const [addPayroll, { isLoading: isAdding }] = useAddPayrollMutation()
  const [updatePayroll, { isLoading: isUpdating }] = useUpdatePayrollMutation()

  const { data: employees = [], isLoading: isLoadingEmployees } = useGetEmployeeQuery()

  const defaultValues: Partial<PayrollFormValues> = {
    employee: payroll?.employee?.id || "",
    date: payroll?.date ? new Date(payroll.date) : undefined,
    basic_salary: payroll?.basic_salary || 0,
    allowances: payroll?.allowances || 0,
    deductions: payroll?.deductions || 0,
    status: payroll?.status || "pending",
    notes: payroll?.notes || "",
    transaction_id: payroll?.transaction_id || "",
  }

  const form = useForm<PayrollFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const watchBasicSalary = form.watch("basic_salary")
  const watchAllowances = form.watch("allowances")
  const watchDeductions = form.watch("deductions")
  const watchStatus = form.watch("status")

  // Calculate net salary whenever inputs change
  useEffect(() => {
    const basic = Number(watchBasicSalary) || 0
    const allowances = Number(watchAllowances) || 0
    const deductions = Number(watchDeductions) || 0
    setNetSalary(basic + allowances - deductions)
  }, [watchBasicSalary, watchAllowances, watchDeductions])

  async function onSubmit(values: PayrollFormValues) {
    try {
      // Format the data exactly as required by the API
      const payload = {
        employee: values.employee,
        basic_salary: values.basic_salary,
        allowances: values.allowances,
        deductions: values.deductions,
        notes: values.notes || "still need to pay",
      }

      console.log("Submitting payroll data:", payload) // For debugging

      if (isEditing && payroll?.id) {
        await updatePayroll({ id: payroll.id, ...payload }).unwrap()
        toast({
          title: "Success",
          description: "Payroll updated successfully",
        })
      } else {
        await addPayroll(payload).unwrap()
        toast({
          title: "Success",
          description: "Payroll created successfully",
        })
      }

      router.push("/hr/payroll")
      router.refresh()
    } catch (error: any) {
      console.error("Error saving payroll:", error)
      
      let errorMessage = `Failed to ${isEditing ? "update" : "create"} payroll`
      
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
        <CardTitle>{isEditing ? "Edit Payroll" : "Generate Payroll"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                            {employee.name} ({employee.job_title})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date Field - Optional
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            disabled={isLoading}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date (optional)</span>}
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
                    <FormDescription>
                      Leave empty if not applicable
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

              {/* Basic Salary */}
              <FormField
                control={form.control}
                name="basic_salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Basic Salary *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        {...field} 
                        disabled={isLoading}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? 0 : parseFloat(value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Allowances */}
              <FormField
                control={form.control}
                name="allowances"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allowances</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        {...field} 
                        disabled={isLoading}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? 0 : parseFloat(value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Deductions */}
              <FormField
                control={form.control}
                name="deductions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deductions</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        {...field} 
                        disabled={isLoading}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? 0 : parseFloat(value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Net Salary (Calculated) */}
              <FormItem>
                <FormLabel>Net Salary (Calculated)</FormLabel>
                <Input 
                  type="number" 
                  value={netSalary} 
                  disabled 
                  className="bg-muted font-medium"
                />
                <FormDescription>
                  Automatically calculated: Basic Salary + Allowances - Deductions
                </FormDescription>
              </FormItem>

              {/* Status */}
              {/* <FormField
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
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

              {/* Transaction ID - Optional */}
              {/* <FormField
                control={form.control}
                name="transaction_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction ID (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter transaction ID" 
                        {...field} 
                        disabled={isLoading}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty if not available
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about this payroll (e.g., 'still need to pay')" 
                      {...field} 
                      disabled={isLoading}
                      value={field.value || "still need to pay"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || isLoadingEmployees}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  isEditing ? "Update Payroll" : "Create Payroll"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
