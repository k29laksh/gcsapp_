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

    const vessels = await prisma.vessel.findMany({
      include: {
        customer: true,
        projects: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(vessels)
  } catch (error) {
    console.error("Error fetching vessels:", error)
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
    if (!body.vesselName || !body.vesselType || !body.customerId) {
      return new NextResponse(
        JSON.stringify({ message: "Missing required fields: vesselName, vesselType, and customerId are required" }),
        { status: 400 },
      )
    }

    // Create vessel
    const vessel = await prisma.vessel.create({
      data: {
        vesselName: body.vesselName,
        imoNumber: body.imoNumber || null,
        vesselType: body.vesselType,
        flag: body.flag || null,
        classificationSociety: body.classificationSociety || null,
        classNotation: body.classNotation || null,
        buildYear: body.buildYear ? Number.parseInt(body.buildYear) : null,
        shipyard: body.shipyard || null,
        length: body.length ? Number.parseFloat(body.length) : null,
        breadth: body.breadth ? Number.parseFloat(body.breadth) : null,
        depth: body.depth ? Number.parseFloat(body.depth) : null,
        grossTonnage: body.grossTonnage ? Number.parseFloat(body.grossTonnage) : null,
        netTonnage: body.netTonnage ? Number.parseFloat(body.netTonnage) : null,
        deadweight: body.deadweight ? Number.parseFloat(body.deadweight) : null,
        customerId: body.customerId,
      },
      include: {
        customer: true,
      },
    })

    // Create activity log with proper error handling
    try {
      if (session.user?.id) {
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: "CREATE",
            entityType: "VESSEL",
            entityId: vessel.id,
            description: `Created vessel: ${vessel.vesselName}`,
          },
        })
      } else {
        console.warn("User ID not found in session. Cannot create activity log.")
      }
    } catch (activityLogError) {
      console.error("Error creating activity log:", activityLogError)
      // Continue without failing the vessel creation
    }

    return NextResponse.json(vessel)
  } catch (error) {
    console.error("Error creating vessel:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
