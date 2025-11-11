import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    const leaveTypes = await prisma.leaveType.findMany({
      include: {
        _count: {
          select: {
            leaveRequests: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(leaveTypes)
  } catch (error) {
    console.error("Error fetching leave types:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    const body = await req.json()

    // Validate required fields
    if (!body.name || !body.allowedDays) {
      return new NextResponse(
        JSON.stringify({ message: "Missing required fields: name and allowedDays are required" }),
        { status: 400 },
      )
    }

    // Create leave type
    const leaveType = await prisma.leaveType.create({
      data: {
        name: body.name,
        description: body.description || "",
        allowedDays: Number.parseInt(body.allowedDays),
        isPaid: body.isPaid !== undefined ? body.isPaid : true,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "LEAVE_TYPE",
        entityId: leaveType.id,
        description: `Created leave type: ${leaveType.name}`,
      },
    })

    return NextResponse.json(leaveType)
  } catch (error) {
    console.error("Error creating leave type:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
