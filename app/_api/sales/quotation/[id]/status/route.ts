import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = params
    const { status } = await req.json()

    // Validate status
    const validStatuses = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"]
    if (!validStatuses.includes(status)) {
      return new NextResponse("Invalid status", { status: 400 })
    }

    const quotation = await prisma.quotation.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        project: true,
        items: true,
      },
    })

    // Create activity log
    try {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          entityType: "QUOTATION",
          entityId: quotation.id,
          description: `Updated quotation status to ${status}: ${quotation.quotationNumber}`,
        },
      })
    } catch (activityError) {
      console.error("Failed to create activity log:", activityError)
    }

    return NextResponse.json(quotation)
  } catch (error) {
    console.error("Error updating quotation status:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// Add PUT method to handle status updates via PUT as well
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return PATCH(req, { params })
}
