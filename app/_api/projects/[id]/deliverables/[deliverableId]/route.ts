import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: { id: string; deliverableId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    const deliverable = await prisma.projectDeliverable.findUnique({
      where: {
        id: params.deliverableId,
        projectId: params.id,
      },
    })

    if (!deliverable) {
      return new NextResponse(JSON.stringify({ message: "Deliverable not found" }), { status: 404 })
    }

    return NextResponse.json(deliverable)
  } catch (error) {
    console.error("Error fetching deliverable:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string; deliverableId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    const data = await req.json()

    // Check if deliverable exists
    const existingDeliverable = await prisma.projectDeliverable.findUnique({
      where: {
        id: params.deliverableId,
        projectId: params.id,
      },
    })

    if (!existingDeliverable) {
      return new NextResponse(JSON.stringify({ message: "Deliverable not found" }), { status: 404 })
    }

    // Update deliverable
    const deliverable = await prisma.projectDeliverable.update({
      where: {
        id: params.deliverableId,
      },
      data: {
        irsProjectId: data.irsProjectId,
        irsPassword: data.irsPassword || "",
        documentTitle: data.documentTitle,
        documentNumber: data.documentNumber || "",
        latestRevisionNumber: data.latestRevisionNumber || "0",
        planCategory: data.planCategory || "",
        status: data.status || "DRAFT",
        transmittalDate: data.transmittalDate ? new Date(data.transmittalDate) : null,
        submittedDate: data.submittedDate ? new Date(data.submittedDate) : null,
        approvedDate: data.approvedDate ? new Date(data.approvedDate) : null,
        reminderDays: Number.parseInt(data.reminderDays) || 30,
        remarks: data.remarks || "",
        invoiceRaised: data.invoiceRaised || false,
        planMadeBy: data.planMadeBy || "",
        planWithIRS: data.planWithIRS || "",
        contactDetails: data.contactDetails || "",
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "DELIVERABLE",
        entityId: deliverable.id,
        description: `Updated deliverable: ${deliverable.documentTitle}`,
      },
    })

    return NextResponse.json(deliverable)
  } catch (error) {
    console.error("Error updating deliverable:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string; deliverableId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    // Check if deliverable exists
    const existingDeliverable = await prisma.projectDeliverable.findUnique({
      where: {
        id: params.deliverableId,
        projectId: params.id,
      },
    })

    if (!existingDeliverable) {
      return new NextResponse(JSON.stringify({ message: "Deliverable not found" }), { status: 404 })
    }

    // Delete deliverable
    await prisma.projectDeliverable.delete({
      where: {
        id: params.deliverableId,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entityType: "DELIVERABLE",
        entityId: params.deliverableId,
        description: `Deleted deliverable: ${existingDeliverable.documentTitle}`,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting deliverable:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
