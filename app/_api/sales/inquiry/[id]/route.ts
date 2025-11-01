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

    const inquiry = await prisma.inquiry.findUnique({
      where: {
        id: params.id,
      },
      include: {
        customer: true,
        assignedTo: true,
      },
    })

    if (!inquiry) {
      return new NextResponse(JSON.stringify({ message: "Inquiry not found" }), { status: 404 })
    }

    return NextResponse.json(inquiry)
  } catch (error) {
    console.error("Error fetching inquiry:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    const body = await req.json()

    // Get the current inquiry to check for status change and assignment change
    const currentInquiry = await prisma.inquiry.findUnique({
      where: {
        id: params.id,
      },
      select: {
        status: true,
        assignedToId: true,
        subject: true,
      },
    })

    if (!currentInquiry) {
      return new NextResponse(JSON.stringify({ message: "Inquiry not found" }), { status: 404 })
    }

    // Update inquiry
    const inquiry = await prisma.inquiry.update({
      where: {
        id: params.id,
      },
      data: body,
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "INQUIRY",
        entityId: inquiry.id,
        details: `Updated inquiry: ${inquiry.subject}`,
      },
    })

    // Create notification for status change
    if (body.status && body.status !== currentInquiry.status) {
      // Notify managers about status change
      const managers = await prisma.employee.findMany({
        where: {
          position: {
            contains: "Manager",
          },
        },
        select: {
          userId: true,
        },
      })

      for (const manager of managers) {
        if (manager.userId) {
          await prisma.notification.create({
            data: {
              userId: manager.userId,
              title: "Inquiry Status Changed",
              message: `Inquiry "${inquiry.subject}" status changed to ${body.status.replace("_", " ")}`,
              type: "INFO",
              relatedEntityType: "INQUIRY",
              relatedEntityId: inquiry.id,
            },
          })
        }
      }
    }

    // Create notification for new assignment
    if (body.assignedToId && body.assignedToId !== currentInquiry.assignedToId && body.assignedToId !== "") {
      const assignedUser = await prisma.employee.findUnique({
        where: {
          id: body.assignedToId,
        },
        select: {
          userId: true,
        },
      })

      if (assignedUser?.userId) {
        await prisma.notification.create({
          data: {
            userId: assignedUser.userId,
            title: "Inquiry Assigned",
            message: `You have been assigned to inquiry: ${inquiry.subject}`,
            type: "INFO",
            relatedEntityType: "INQUIRY",
            relatedEntityId: inquiry.id,
          },
        })
      }
    }

    return NextResponse.json(inquiry)
  } catch (error) {
    console.error("Error updating inquiry:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    // Get the inquiry details before deletion for activity log
    const inquiry = await prisma.inquiry.findUnique({
      where: {
        id: params.id,
      },
      select: {
        subject: true,
      },
    })

    if (!inquiry) {
      return new NextResponse(JSON.stringify({ message: "Inquiry not found" }), { status: 404 })
    }

    // Delete inquiry
    await prisma.inquiry.delete({
      where: {
        id: params.id,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entityType: "INQUIRY",
        entityId: params.id,
        details: `Deleted inquiry: ${inquiry.subject}`,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting inquiry:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
