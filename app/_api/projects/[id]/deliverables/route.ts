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

    const deliverables = await prisma.projectDeliverable.findMany({
      where: {
        projectId: params.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(deliverables)
  } catch (error) {
    console.error("Error fetching deliverables:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    const data = await req.json()

    // Validate required fields
    if (!data.irsProjectId || !data.documentTitle) {
      return new NextResponse(JSON.stringify({ message: "IRS Project ID and Document Title are required" }), {
        status: 400,
      })
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: params.id },
    })

    if (!project) {
      return new NextResponse(JSON.stringify({ message: "Project not found" }), { status: 404 })
    }

    // Create deliverable
    const deliverable = await prisma.projectDeliverable.create({
      data: {
        projectId: params.id,
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
        action: "CREATE",
        entityType: "DELIVERABLE",
        entityId: deliverable.id,
        description: `Created deliverable: ${deliverable.documentTitle}`,
      },
    })

    return NextResponse.json(deliverable)
  } catch (error) {
    console.error("Error creating deliverable:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
