import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Try to import prisma
let prisma: any = null
try {
  prisma = require("@/lib/prisma").default || require("@/lib/prisma").prisma
} catch (error) {
  console.log("Prisma not available, using fallback")
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    if (prisma) {
      try {
        const leaveRequest = await prisma.leaveRequest.findUnique({
          where: { id: params.id },
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

        if (!leaveRequest) {
          return new NextResponse("Leave request not found", { status: 404 })
        }

        return NextResponse.json(leaveRequest)
      } catch (dbError) {
        console.error("Database error:", dbError)
        return new NextResponse("Database error", { status: 500 })
      }
    }

    // Fallback mock data
    const mockLeaveRequest = {
      id: params.id,
      employeeId: "emp1",
      leaveType: "SICK",
      startDate: new Date(),
      endDate: new Date(),
      totalDays: 1,
      reason: "Mock leave request - database unavailable",
      status: "PENDING",
      contactDetails: "",
      emergencyContact: "",
      employee: {
        id: "emp1",
        firstName: "John",
        lastName: "Doe",
        employeeId: "EMP001",
        position: "Software Developer",
        email: "john.doe@example.com",
      },
    }

    return NextResponse.json(mockLeaveRequest)
  } catch (error) {
    console.error("Error fetching leave request:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()

    if (prisma) {
      try {
        // Check if leave request exists
        const existingRequest = await prisma.leaveRequest.findUnique({
          where: { id: params.id },
        })

        if (!existingRequest) {
          return new NextResponse("Leave request not found", { status: 404 })
        }

        // Update leave request
        const leaveRequest = await prisma.leaveRequest.update({
          where: { id: params.id },
          data: {
            leaveType: body.leaveType?.toUpperCase(),
            startDate: body.startDate ? new Date(body.startDate) : undefined,
            endDate: body.endDate ? new Date(body.endDate) : undefined,
            totalDays: body.totalDays ? Number(body.totalDays) : undefined,
            reason: body.reason,
            contactDetails: body.contactDetails,
            emergencyContact: body.emergencyContact,
            status: body.status?.toUpperCase(),
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

        return NextResponse.json(leaveRequest)
      } catch (dbError) {
        console.error("Database error updating leave request:", dbError)
        return new NextResponse("Database error: " + dbError.message, { status: 500 })
      }
    }

    return new NextResponse("Database not available", { status: 503 })
  } catch (error) {
    console.error("Error updating leave request:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    if (prisma) {
      try {
        // Check if leave request exists
        const existingRequest = await prisma.leaveRequest.findUnique({
          where: { id: params.id },
        })

        if (!existingRequest) {
          return new NextResponse("Leave request not found", { status: 404 })
        }

        // Delete leave request
        await prisma.leaveRequest.delete({
          where: { id: params.id },
        })

        return new NextResponse(null, { status: 204 })
      } catch (dbError) {
        console.error("Database error deleting leave request:", dbError)
        return new NextResponse("Database error: " + dbError.message, { status: 500 })
      }
    }

    return new NextResponse("Database not available", { status: 503 })
  } catch (error) {
    console.error("Error deleting leave request:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
