// app/hr/attendance/page.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { CalendarIcon, Plus, Edit, Trash2, MoreHorizontal, Users, Clock, CheckCircle, X, Loader2 } from "lucide-react"
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
  useGetAttendanceQuery,
  useDeleteAttendanceMutation,
} from "@/redux/Service/attendance"
import { useGetEmployeeQuery } from "@/redux/Service/employee"

interface AttendanceRecord {
  id: string
  date: string
  check_in: string | null
  check_out: string | null
  status: string
  hours_worked: number | null
  notes: string | null
  employee: string // employee ID
  employee_details?: {
    id: string
    name: string
    employee_id: string
    position: string
    department_name: string
  }
}

interface AttendanceStats {
  totalRecords: number
  presentCount: number
  absentCount: number
  lateCount: number
}

export default function AttendancePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [date, setDate] = useState<Date>(new Date())
  const [selectedEmployee, setSelectedEmployee] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // RTK Query hooks
  const { 
    data: attendanceData = [], 
    isLoading, 
    error,
    refetch 
  } = useGetAttendanceQuery({ date: format(date, "yyyy-MM-dd") })
  
  const [deleteAttendance] = useDeleteAttendanceMutation()
  const { data: employees = [] } = useGetEmployeeQuery(undefined)

  // Calculate stats
  const stats = useMemo(() => {
    const totalRecords = attendanceData.length
    const presentCount = attendanceData.filter((record: AttendanceRecord) => record.status === "PRESENT").length
    const absentCount = attendanceData.filter((record: AttendanceRecord) => record.status === "ABSENT").length
    const lateCount = attendanceData.filter((record: AttendanceRecord) => record.status === "LATE").length
    
    return {
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
    }
  }, [attendanceData])

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = attendanceData

    if (selectedEmployee !== "all") {
      filtered = filtered.filter((record: AttendanceRecord) => record.employee === selectedEmployee)
    }

    if (searchTerm) {
      filtered = filtered.filter((record: AttendanceRecord) => {
        const emp = employees.find((e: any) => e.id === record.employee)
        const name = emp?.name || ""
        const employeeId = emp?.employee_id || ""
        return (
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employeeId.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((record: AttendanceRecord) => record.status === statusFilter)
    }

    return filtered
  }, [attendanceData, selectedEmployee, searchTerm, statusFilter, employees])

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load attendance data",
        variant: "destructive",
      })
    }
  }, [error, toast])

  const handleDelete = async (id: string, employeeName: string) => {
    if (!confirm(`Are you sure you want to delete the attendance record for ${employeeName}?`)) return

    try {
      await deleteAttendance(id).unwrap()
      toast({
        title: "Success",
        description: "Attendance record deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting attendance:", error)
      toast({
        title: "Error",
        description: "Failed to delete attendance record",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PRESENT: { className: "bg-green-100 text-green-800 border-green-300" },
      ABSENT: { className: "bg-red-100 text-red-800 border-red-300" },
      LATE: { className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      HALF_DAY: { className: "bg-blue-100 text-blue-800 border-blue-300" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PRESENT

    return <Badge className={config.className}>{status.replace("_", " ")}</Badge>
  }

  const columns: ColumnDef<AttendanceRecord>[] = [
    {
      accessorKey: "employee",
      header: "Employee",
      cell: ({ row }) => {
        const employee = row.getValue("employee") as string
        return (
          <div>
            <div className="font-medium">
              {employee?.name || "Unknown Employee"}
            </div>
            <div className="text-sm text-muted-foreground">
              {employee?.job_title || "N/A"} • {employee?.department_name || "N/A"}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => format(new Date(row.getValue("date")), "PPP"),
    },
    {
      accessorKey: "check_in",
      header: "Check In",
      cell: ({ row }) => {
        const checkIn = row.getValue("check_in") as string | null
        return checkIn ? checkIn.substring(0, 5) : "-"
      },
    },
    {
      accessorKey: "check_out",
      header: "Check Out",
      cell: ({ row }) => {
        const checkOut = row.getValue("check_out") as string | null
        return checkOut ? checkOut.substring(0, 5) : "-"
      },
    },
    {
      accessorKey: "hours_worked",
      header: "Hours Worked",
      cell: ({ row }) => {
        const hours = row.getValue("hours_worked") as number | null
        return hours ? `${hours.toFixed(2)}h` : "-"
      },
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
        const attendance = row.original
        const employee = employees.find((emp: any) => emp.id === attendance.employee)
        
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
              <DropdownMenuItem onClick={() => router.push(`/hr/attendance/${attendance.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(attendance.id, employee?.name || "Employee")}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const breadcrumbs = [{ label: "HR", href: "/hr" }, { label: "Attendance Management" }]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Management"
        description="Track and manage employee attendance records"
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
                  {date ? format(date, "PPP") : <span>Select date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
              </PopoverContent>
            </Popover>
            <Button onClick={() => router.push("/hr/attendance/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Mark Attendance
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecords}</div>
            <p className="text-xs text-muted-foreground">Today's records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.presentCount}</div>
            <p className="text-xs text-muted-foreground">On time arrivals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.lateCount}</div>
            <p className="text-xs text-muted-foreground">Late arrivals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <X className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.absentCount}</div>
            <p className="text-xs text-muted-foreground">Absent today</p>
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
                    {employee.name}
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
                <SelectItem value="PRESENT">Present</SelectItem>
                <SelectItem value="ABSENT">Absent</SelectItem>
                <SelectItem value="LATE">Late</SelectItem>
                <SelectItem value="HALF_DAY">Half Day</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Attendance for {format(date, "PPP")} ({filteredData.length})
          </CardTitle>
          <CardDescription>View and manage daily attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTableEnhanced
            columns={columns}
            data={filteredData}
            searchKey="employee"
            searchPlaceholder="Search attendance records..."
            loading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}