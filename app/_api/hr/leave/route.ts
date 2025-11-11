import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Try to import prisma
let prisma: any = null
try {
  prisma = require("@/lib/prisma").default || require("@/lib/prisma").prisma
} catch (error) {
  console.log("Prisma not available, using fallback")
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const employeeId = searchParams.get("employeeId")
    const leaveType = searchParams.get("leaveType")

    if (prisma) {
      try {
        const whereClause: any = {}

        if (status && status !== "all") {
          whereClause.status = status.toUpperCase()
        }

        if (employeeId && employeeId !== "all") {
          whereClause.employeeId = employeeId
        }

        if (leaveType && leaveType !== "all") {
          whereClause.leaveType = leaveType.toUpperCase()
        }

        const leaveRequests = await prisma.leaveRequest.findMany({
          where: whereClause,
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
                position: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        })

        return NextResponse.json(leaveRequests)
      } catch (dbError) {
        console.error("Database error fetching leave requests:", dbError)
        // Fall through to mock data
      }
    }

    // Fallback mock data
    const mockData = [
      {
        id: "mock_1",
        employeeId: "emp1",
        leaveType: "SICK",
        startDate: new Date(),
        endDate: new Date(),
        totalDays: 1,
        reason: "Mock leave request - database unavailable",
        status: "PENDING",
        contactDetails: "",
        emergencyContact: "",
        createdAt: new Date(),
        employee: {
          id: "emp1",
          firstName: "John",
          lastName: "Doe",
          employeeId: "EMP001",
          position: "Software Developer",
          email: "john.doe@example.com",
        },
      },
    ]

    return NextResponse.json(mockData)
  } catch (error) {
    console.error("Error fetching leave requests:", error)
    return NextResponse.json({ message: "Failed to fetch leave requests" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.employeeId || !data.leaveType || !data.startDate || !data.endDate || !data.reason) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    if (prisma) {
      try {
        // Check if employee exists
        const employee = await prisma.employee.findUnique({
          where: { id: data.employeeId },
        })

        if (!employee) {
          return NextResponse.json({ message: "Employee not found" }, { status: 404 })
        }

        // Create leave request
        const leaveRequest = await prisma.leaveRequest.create({
          data: {
            employeeId: data.employeeId,
            leaveType: data.leaveType.toUpperCase(),
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            totalDays: Number(data.totalDays),
            reason: data.reason,
            contactDetails: data.contactDetails || "",
            emergencyContact: data.emergencyContact || "",
            status: "PENDING",
          },
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
                position: true,
                email: true,
              },
            },
          },
        })

        return NextResponse.json(leaveRequest, { status: 201 })
      } catch (dbError) {
        console.error("Database error creating leave request:", dbError)
        return NextResponse.json({ message: "Database error: " + dbError.message }, { status: 500 })
      }
    }

    // Fallback for when database is not available
    return NextResponse.json({ message: "Database not available" }, { status: 503 })
  } catch (error) {
    console.error("Error creating leave request:", error)
    return NextResponse.json({ message: "Failed to create leave request" }, { status: 500 })
  }
}
