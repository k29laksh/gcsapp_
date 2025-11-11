import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    const leaveType = await prisma.leaveType.findUnique({
      where: {
        id: params.id,
      },
      include: {
        leaveRequests: {
          include: {
            employee: true,
          },
        },
      },
    })

    if (!leaveType) {
      return new NextResponse(JSON.stringify({ message: "Leave type not found" }), { status: 404 })
    }

    return NextResponse.json(leaveType)
  } catch (error) {
    console.error("Error fetching leave type:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    const data = await req.json()

    // Check if leave type exists
    const existingLeaveType = await prisma.leaveType.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingLeaveType) {
      return new NextResponse(JSON.stringify({ message: "Leave type not found" }), { status: 404 })
    }

    // Update leave type
    const leaveType = await prisma.leaveType.update({
      where: {
        id: params.id,
      },
      data: {
        name: data.name,
        description: data.description || "",
        allowedDays: Number.parseInt(data.allowedDays),
        isPaid: data.isPaid !== undefined ? data.isPaid : true,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "LEAVE_TYPE",
        entityId: leaveType.id,
        description: `Updated leave type: ${leaveType.name}`,
      },
    })

    return NextResponse.json(leaveType)
  } catch (error) {
    console.error("Error updating leave type:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    // Check if leave type exists
    const existingLeaveType = await prisma.leaveType.findUnique({
      where: {
        id: params.id,
      },
      include: {
        leaveRequests: true,
      },
    })

    if (!existingLeaveType) {
      return new NextResponse(JSON.stringify({ message: "Leave type not found" }), { status: 404 })
    }

    // Check if leave type is being used
    if (existingLeaveType.leaveRequests.length > 0) {
      return new NextResponse(
        JSON.stringify({ message: "Cannot delete leave type that has associated leave requests" }),
        { status: 400 },
      )
    }

    // Delete leave type
    await prisma.leaveType.delete({
      where: {
        id: params.id,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entityType: "LEAVE_TYPE",
        entityId: params.id,
        description: `Deleted leave type: ${existingLeaveType.name}`,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting leave type:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
