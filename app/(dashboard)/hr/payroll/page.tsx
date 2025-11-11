"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import {
  CalendarIcon,
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DataTableEnhanced } from "@/components/ui/data-table-enhanced"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/ui/page-header"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ColumnDef } from "@tanstack/react-table"
import {
  useGetPayrollQuery,
  useDeletePayrollMutation,
  useDownloadPayslipMutation,
} from "@/redux/Service/payroll"
import { useGetEmployeeQuery } from "@/redux/Service/employee"

interface PayrollRecord {
  id: string
  employee: string // employee ID
  date: string
  basic_salary: string
  allowances: string
  deductions: string
  net_salary: string
  status: string
  notes?: string
  pdf?: string
  pay_month: string
  transaction_id?: string
}

export default function PayrollPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [date, setDate] = useState<Date>(new Date())
  const [selectedEmployee, setSelectedEmployee] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const { data: payrollData = [], isLoading, error } = useGetPayrollQuery({ month: format(date, "yyyy-MM") })
  const [deletePayroll] = useDeletePayrollMutation()
  const [downloadPayslip] = useDownloadPayslipMutation()
  const { data: employees = [] } = useGetEmployeeQuery()

  const stats = useMemo(() => {
    const totalPayroll = payrollData.reduce((sum, record) => sum + Number(record.net_salary), 0)
    const totalRecords = payrollData.length
    const paidCount = payrollData.filter((r) => r.status === "paid").length
    const pendingCount = payrollData.filter((r) => r.status === "pending").length
    return { totalPayroll, totalRecords, paidCount, pendingCount }
  }, [payrollData])

  const filteredData = useMemo(() => {
    let filtered = payrollData

    if (selectedEmployee !== "all") {
      filtered = filtered.filter((record) => record.employee === selectedEmployee)
    }

    if (searchTerm) {
      filtered = filtered.filter((record) => {
        const emp = employees.find((e: any) => e.id === record.employee)
        const fullName = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase() : ""
        const empId = emp ? emp.employeeId.toLowerCase() : ""
        return fullName.includes(searchTerm.toLowerCase()) || empId.includes(searchTerm.toLowerCase())
      })
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((record) => record.status === statusFilter)
    }

    return filtered
  }, [payrollData, selectedEmployee, searchTerm, statusFilter, employees])

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load payroll data",
      variant: "destructive",
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payroll record?")) return

    try {
      await deletePayroll(id).unwrap()
      toast({
        title: "Success",
        description: "Payroll record deleted successfully",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete payroll record",
        variant: "destructive",
      })
    }
  }

  const handleDownloadPayslip = async (pdfUrl?: string) => {
    if (!pdfUrl) return
    try {
      const a = document.createElement("a")
      a.href = pdfUrl
      a.download = pdfUrl.split("/").pop() || "payslip.pdf"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast({ title: "Success", description: "Payslip downloaded successfully" })
    } catch {
      toast({ title: "Error", description: "Failed to download payslip", variant: "destructive" })
    }
  }

  const getStatusBadge = (status: string) => (
    <Badge
      variant={status === "paid" ? "default" : "outline"}
      className={
        status === "paid"
          ? "bg-green-100 text-green-800 border-green-300"
          : "bg-yellow-100 text-yellow-800 border-yellow-300"
      }
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )

  const columns: ColumnDef<PayrollRecord>[] = [
   {
  accessorKey: "employee",
  header: "Employee ID",
  cell: ({ row }) => {
    const record = row.original
    return <div className="font-medium">{record.employee}</div>
  },
},

    {
      accessorKey: "pay_month",
      header: "Month",
      cell: ({ row }) => row.getValue("pay_month"),
    },
    {
      accessorKey: "basic_salary",
      header: "Basic Salary",
      cell: ({ row }) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(row.getValue("basic_salary"))),
    },
    {
      accessorKey: "allowances",
      header: "Allowances",
      cell: ({ row }) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(row.getValue("allowances"))),
    },
    {
      accessorKey: "deductions",
      header: "Deductions",
      cell: ({ row }) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(row.getValue("deductions"))),
    },
    {
      accessorKey: "net_salary",
      header: "Net Salary",
      cell: ({ row }) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(row.getValue("net_salary"))),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const record = row.original
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
              <DropdownMenuItem onClick={() => router.push(`/hr/payroll/${record.id}`)}>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/hr/payroll/${record.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadPayslip(record.pdf)}>
                <Download className="mr-2 h-4 w-4" /> Download Payslip
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDelete(record.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const breadcrumbs = [{ label: "HR", href: "/hr" }, { label: "Payroll Management" }]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Management"
        description="Manage employee payroll and salary processing"
        breadcrumbs={breadcrumbs}
        action={
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "MMMM yyyy") : <span>Select month</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
              </PopoverContent>
            </Popover>
            <Button onClick={() => router.push("/hr/payroll/new")}>
              <Plus className="mr-2 h-4 w-4" /> Generate Payroll
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(stats.totalPayroll)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecords}</div>
            <p className="text-xs text-muted-foreground">Payroll records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paidCount}</div>
            <p className="text-xs text-muted-foreground">Completed payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
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
                placeholder="Search by employee name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((employee: any) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Payroll for {format(date, "MMMM yyyy")} ({filteredData.length})
          </CardTitle>
          <CardDescription>View and manage employee payroll records</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTableEnhanced
            columns={columns}
            data={filteredData}
            searchKey="employee"
            searchPlaceholder="Search payroll records..."
            loading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}
