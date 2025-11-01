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

    const vessel = await prisma.vessel.findUnique({
      where: {
        id: params.id,
      },
      include: {
        customer: true,
        projects: true,
      },
    })

    if (!vessel) {
      return new NextResponse(JSON.stringify({ message: "Vessel not found" }), { status: 404 })
    }

    return NextResponse.json(vessel)
  } catch (error) {
    console.error("Error fetching vessel:", error)
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

    // Check if vessel exists
    const existingVessel = await prisma.vessel.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingVessel) {
      return new NextResponse(JSON.stringify({ message: "Vessel not found" }), { status: 404 })
    }

    // Update vessel
    const vessel = await prisma.vessel.update({
      where: {
        id: params.id,
      },
      data: {
        vesselName: data.vesselName,
        imoNumber: data.imoNumber || null,
        vesselType: data.vesselType,
        flag: data.flag || null,
        classificationSociety: data.classificationSociety || null,
        classNotation: data.classNotation || null,
        buildYear: data.buildYear ? Number.parseInt(data.buildYear) : null,
        shipyard: data.shipyard || null,
        length: data.length ? Number.parseFloat(data.length) : null,
        breadth: data.breadth ? Number.parseFloat(data.breadth) : null,
        depth: data.depth ? Number.parseFloat(data.depth) : null,
        grossTonnage: data.grossTonnage ? Number.parseFloat(data.grossTonnage) : null,
        netTonnage: data.netTonnage ? Number.parseFloat(data.netTonnage) : null,
        deadweight: data.deadweight ? Number.parseFloat(data.deadweight) : null,
        customerId: data.customerId,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "VESSEL",
        entityId: vessel.id,
        description: `Updated vessel: ${vessel.vesselName}`,
      },
    })

    return NextResponse.json(vessel)
  } catch (error) {
    console.error("Error updating vessel:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    // Check if vessel exists
    const existingVessel = await prisma.vessel.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingVessel) {
      return new NextResponse(JSON.stringify({ message: "Vessel not found" }), { status: 404 })
    }

    // Delete vessel
    await prisma.vessel.delete({
      where: {
        id: params.id,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entityType: "VESSEL",
        entityId: params.id,
        description: `Deleted vessel: ${existingVessel.vesselName}`,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting vessel:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
