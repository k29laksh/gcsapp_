import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { format, eachDayOfInterval, getDay } from "date-fns"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const month = searchParams.get("month") // Format: YYYY-MM

    if (!employeeId || !month) {
      return NextResponse.json({ error: "Employee ID and month are required" }, { status: 400 })
    }

    // Parse the month and create date range in IST
    const [year, monthNum] = month.split("-").map(Number)
    const startDate = new Date(year, monthNum - 1, 1)
    const endDate = new Date(year, monthNum, 0) // Last day of the month

    // Fetch employee details
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        department: true,
        position: true,
      },
    })

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // Create IST date range for database query
    const startOfMonthIST = new Date(year, monthNum - 1, 1, 0, 0, 0)
    const endOfMonthIST = new Date(year, monthNum, 0, 23, 59, 59)

    // Fetch attendance records for the month
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startOfMonthIST,
          lte: endOfMonthIST,
        },
      },
      orderBy: {
        date: "asc",
      },
    })

    // Create a calendar for the month
    const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate })
    const calendar = daysInMonth.map((day) => {
      const attendance = attendanceRecords.find((record) => {
        const recordDate = new Date(record.date)
        return (
          recordDate.getDate() === day.getDate() &&
          recordDate.getMonth() === day.getMonth() &&
          recordDate.getFullYear() === day.getFullYear()
        )
      })

      const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][getDay(day)]
      const isWeekend = getDay(day) === 0 || getDay(day) === 6

      // Format times in IST
      const checkInIST = attendance?.checkIn
        ? new Date(attendance.checkIn).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        : "-"

      const checkOutIST = attendance?.checkOut
        ? new Date(attendance.checkOut).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        : "-"

      return {
        date: day,
        dayOfWeek,
        status: attendance?.status || (isWeekend ? "Weekend" : "N/A"),
        checkIn: checkInIST,
        checkOut: checkOutIST,
        workHours:
          attendance?.checkIn && attendance?.checkOut
            ? calculateWorkHours(attendance.checkIn, attendance.checkOut)
            : "-",
        notes: attendance?.notes || "",
      }
    })

    // Calculate summary
    const workingDays = calendar.filter((day) => day.status !== "Weekend" && day.status !== "N/A")
    const presentDays = calendar.filter((day) => day.status === "present")
    const absentDays = calendar.filter((day) => day.status === "absent")
    const halfDays = calendar.filter((day) => day.status === "half-day")
    const leaveDays = calendar.filter((day) => day.status === "leave")

    const summary = {
      totalDays: workingDays.length,
      present: presentDays.length,
      absent: absentDays.length,
      halfDay: halfDays.length,
      leave: leaveDays.length,
      attendancePercentage:
        workingDays.length > 0 ? ((presentDays.length + halfDays.length * 0.5) / workingDays.length) * 100 : 0,
    }

    return NextResponse.json({
      employee: {
        name: `${employee.firstName} ${employee.lastName}`,
        employeeId: employee.employeeId,
        department: employee.department,
        position: employee.position,
      },
      month: format(startDate, "MMMM yyyy"),
      calendar,
      summary,
    })
  } catch (error) {
    console.error("Error generating attendance report:", error)
    return NextResponse.json({ error: "Failed to generate attendance report" }, { status: 500 })
  }
}

function calculateWorkHours(checkIn: Date, checkOut: Date): string {
  const checkInTime = new Date(checkIn)
  const checkOutTime = new Date(checkOut)

  const diffMs = checkOutTime.getTime() - checkInTime.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  return `${diffHours}h ${diffMinutes}m`
}
