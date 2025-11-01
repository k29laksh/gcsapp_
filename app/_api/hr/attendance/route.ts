import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const employeeId = searchParams.get("employeeId")

    const whereClause: any = {}

    if (date) {
      // Create IST date range for the entire day
      const startOfDay = new Date(date + "T00:00:00+05:30")
      const endOfDay = new Date(date + "T23:59:59+05:30")

      whereClause.date = {
        gte: startOfDay,
        lte: endOfDay,
      }
    }

    if (employeeId) {
      whereClause.employeeId = employeeId
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    })

    // Transform the data to include a full name property and format times in IST
    const formattedRecords = attendanceRecords.map((record) => ({
      ...record,
      employee: {
        ...record.employee,
        fullName: `${record.employee.firstName} ${record.employee.lastName}`.trim(),
      },
      // Convert times to IST for display
      checkInIST: record.checkIn
        ? new Date(record.checkIn).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        : null,
      checkOutIST: record.checkOut
        ? new Date(record.checkOut).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        : null,
    }))

    return NextResponse.json(formattedRecords)
  } catch (error) {
    console.error("Error fetching attendance records:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const { date, employeeId, status, checkIn, checkOut, notes } = body

    // Validate required fields
    if (!date || !employeeId || !status) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Helper function to convert IST time string to UTC DateTime
    const convertISTTimeToUTC = (timeString: string, dateString: string) => {
      if (!timeString) return null

      // Create IST datetime string
      const istDateTime = `${dateString}T${timeString}:00+05:30`
      return new Date(istDateTime)
    }

    // Create IST date for comparison
    const attendanceDate = new Date(date + "T00:00:00+05:30")

    // Check if attendance record already exists for this employee and date
    const startOfDay = new Date(date + "T00:00:00+05:30")
    const endOfDay = new Date(date + "T23:59:59+05:30")

    const existingRecord = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    })

    if (existingRecord) {
      return new NextResponse("Attendance record already exists for this employee on this date", { status: 409 })
    }

    // Prepare data for creation
    const attendanceData: any = {
      date: attendanceDate,
      employeeId,
      status,
      notes,
    }

    // Add checkIn and checkOut only if they are provided
    if (checkIn) {
      attendanceData.checkIn = convertISTTimeToUTC(checkIn, date)
    }

    if (checkOut) {
      attendanceData.checkOut = convertISTTimeToUTC(checkOut, date)
    }

    // Create new attendance record
    const attendance = await prisma.attendance.create({
      data: attendanceData,
    })

    return NextResponse.json(attendance)
  } catch (error) {
    console.error("Error creating attendance record:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
