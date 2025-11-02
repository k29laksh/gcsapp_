"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { format } from "date-fns"

interface AttendanceRecord {
  date: Date
  dayOfWeek: string
  status: string
  checkIn: string
  checkOut: string
  workHours: string
  notes: string
}

interface AttendanceData {
  employee: {
    name: string
    employeeId: string
    department: string
    position: string
  }
  month: string
  calendar: AttendanceRecord[]
  summary: {
    totalDays: number
    present: number
    absent: number
    halfDay: number
    leave: number
    attendancePercentage: number
  }
}

function AttendanceReportContent() {
  const searchParams = useSearchParams()
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const employeeId = searchParams.get("employeeId")
  const month = searchParams.get("month")

  useEffect(() => {
    if (!employeeId || !month) {
      setError("Employee ID and month are required")
      setLoading(false)
      return
    }

    const fetchAttendanceData = async () => {
      try {
        const response = await fetch(`/api/hr/attendance/print?employeeId=${employeeId}&month=${month}`)
        if (!response.ok) {
          throw new Error("Failed to fetch attendance data")
        }
        const data = await response.json()
        setAttendanceData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchAttendanceData()
  }, [employeeId, month])

  const handlePrint = () => {
    window.print()
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      present: "bg-green-100 text-green-800",
      absent: "bg-red-100 text-red-800",
      "half-day": "bg-yellow-100 text-yellow-800",
      leave: "bg-blue-100 text-blue-800",
      Weekend: "bg-gray-100 text-gray-800",
      "N/A": "bg-gray-100 text-gray-800",
    }

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading attendance report...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    )
  }

  if (!attendanceData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">No attendance data found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h1 className="text-3xl font-bold">Attendance Report</h1>
        <div className="flex gap-2">
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Employee Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-lg font-semibold">{attendanceData.employee.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Employee ID</label>
              <p className="text-lg font-semibold">{attendanceData.employee.employeeId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Department</label>
              <p className="text-lg font-semibold">{attendanceData.employee.department}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Position</label>
              <p className="text-lg font-semibold">{attendanceData.employee.position}</p>
            </div>
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-500">Report Period</label>
            <p className="text-lg font-semibold">{attendanceData.month}</p>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Attendance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{attendanceData.summary.totalDays}</p>
              <p className="text-sm text-gray-500">Total Days</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{attendanceData.summary.present}</p>
              <p className="text-sm text-gray-500">Present</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{attendanceData.summary.absent}</p>
              <p className="text-sm text-gray-500">Absent</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{attendanceData.summary.halfDay}</p>
              <p className="text-sm text-gray-500">Half Day</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{attendanceData.summary.leave}</p>
              <p className="text-sm text-gray-500">Leave</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">
                {attendanceData.summary.attendancePercentage.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">Attendance</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Day</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Check In</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Check Out</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Work Hours</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.calendar.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">{format(new Date(record.date), "dd/MM/yyyy")}</td>
                    <td className="border border-gray-300 px-4 py-2">{record.dayOfWeek}</td>
                    <td className="border border-gray-300 px-4 py-2">{getStatusBadge(record.status)}</td>
                    <td className="border border-gray-300 px-4 py-2">{record.checkIn}</td>
                    <td className="border border-gray-300 px-4 py-2">{record.checkOut}</td>
                    <td className="border border-gray-300 px-4 py-2">{record.workHours}</td>
                    <td className="border border-gray-300 px-4 py-2">{record.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Print Footer */}
      <div className="mt-8 text-center text-sm text-gray-500 print:block hidden">
        <p>Generated on {format(new Date(), "dd/MM/yyyy 'at' HH:mm")}</p>
        <p>This is a computer-generated report and does not require a signature.</p>
      </div>
    </div>
  )
}

export default function AttendanceReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      }
    >
      <AttendanceReportContent />
    </Suspense>
  )
}

