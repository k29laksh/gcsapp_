"use client"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import {
  useAddEmployeeMutation,
  useUpdateEmployeeMutation,
  useGetEmployeeQuery,
} from "@/redux/Service/employee" 
import type { Employee } from "@/types"

const formSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  jobTitle: z.string().min(2, { message: "Job title must be at least 2 characters." }),
  department: z.string().min(2, { message: "Department must be at least 2 characters." }),
  basicSalary: z.string().optional(),
  hourlyRate: z.string().optional(),
  reportingManagerId: z.string().nullable().optional(),
  employmentType: z.string().min(2, { message: "Employment type must be at least 2 characters." }),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
})

interface EmployeeFormProps {
  employee?: Employee
  isEditing: boolean
}

export function EmployeeForm({ employee, isEditing }: EmployeeFormProps) {
  const router = useRouter()

  // ✅ RTK hooks
  const { data: managers = [], isLoading: managersLoading } = useGetEmployeeQuery({})
  console.log("Managers:", managers)
  const [addEmployee, { isLoading: adding }] = useAddEmployeeMutation()
  const [updateEmployee, { isLoading: updating }] = useUpdateEmployeeMutation()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: employee?.firstName || "",
      lastName: employee?.lastName || "",
      email: employee?.email || "",
      jobTitle: employee?.jobTitle || "",
      department: employee?.department || "",
      basicSalary: employee?.basicSalary?.toString() || "",
      hourlyRate: employee?.hourlyRate?.toString() || "",
      reportingManagerId: employee?.reportingManagerId || null,
      employmentType: employee?.employmentType || "",
      phoneNumber: employee?.phoneNumber || "",
      address: employee?.address || "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const formattedData: any = {
        name: `${values.firstName} ${values.lastName}`,
        email: values.email,
        job_title: values.jobTitle,
        department: values.department,
        employment_type: values.employmentType,
        basic_salary: values.basicSalary ? Number(values.basicSalary) : 0,
        hourly_rate: values.hourlyRate ? Number(values.hourlyRate) : 0,
        phone_number: values.phoneNumber || "",
        address: values.address || "",
      }

      if (values.reportingManagerId && values.reportingManagerId !== "none") {
        formattedData.manager = values.reportingManagerId
      }
      

      if (isEditing && employee) {
        await updateEmployee({ userId: employee.id, ...formattedData }).unwrap()
        toast.success("Employee updated successfully")
      } else {
        await addEmployee(formattedData).unwrap()
        toast.success("Employee created successfully")
      }

      router.push("/hr/employees")
      router.refresh()
    } catch (error: any) {
      toast.error(
        error?.data?.message || `Failed to ${isEditing ? "update" : "create"} employee`
      )
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* First & Last Name */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Email & Job Title */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="john.doe@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="jobTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input placeholder="Software Engineer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Department & Employment Type */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <Input placeholder="Engineering" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="employmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employment Type</FormLabel>
                <FormControl>
                  <Input placeholder="Full-time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Salary & Hourly Rate */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="basicSalary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Basic Salary</FormLabel>
                <FormControl>
                  <Input placeholder="50000" type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hourlyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hourly Rate</FormLabel>
                <FormControl>
                  <Input placeholder="25" type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Manager */}
        <FormField
          control={form.control}
          name="reportingManagerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reporting Manager</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || "none"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {!managersLoading &&
                    managers.map((manager: Employee) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone & Address */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="123-456-7890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main St" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit */}
        <Button type="submit" disabled={adding || updating}>
          {(adding || updating) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isEditing ? "Update Employee" : "Create Employee"}
        </Button>
      </form>
    </Form>
  )
}
