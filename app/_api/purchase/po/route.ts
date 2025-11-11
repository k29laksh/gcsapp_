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

    const pos = await prisma.pO.findMany({
      include: {
        vendor: true,
        project: true,
        items: true,
        bills: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(pos)
  } catch (error) {
    console.error("Error fetching purchase orders:", error)
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
    if (!body.poNumber || !body.vendorId || !body.items || body.items.length === 0) {
      return new NextResponse(
        JSON.stringify({ message: "Missing required fields: poNumber, vendorId, and items are required" }),
        { status: 400 },
      )
    }

    // Create PO with items
    const po = await prisma.pO.create({
      data: {
        poNumber: body.poNumber,
        date: body.date ? new Date(body.date) : new Date(),
        vendorId: body.vendorId,
        projectId: body.projectId === "none" ? null : body.projectId,
        subtotal: Number.parseFloat(body.subtotal) || 0,
        tax: Number.parseFloat(body.tax) || 0,
        total: Number.parseFloat(body.total) || 0,
        notes: body.notes || "",
        status: body.status || "DRAFT",
        items: {
          create: body.items.map((item: any) => ({
            description: item.description,
            quantity: Number.parseFloat(item.quantity) || 0,
            unitPrice: Number.parseFloat(item.unitPrice) || 0,
            tax: Number.parseFloat(item.tax) || 0,
            total: Number.parseFloat(item.total) || 0,
            hsn: item.hsn || "",
            sacCode: item.sacCode || "",
          })),
        },
      },
      include: {
        vendor: true,
        project: true,
        items: true,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "PO",
        entityId: po.id,
        description: `Created purchase order: ${po.poNumber}`,
      },
    })

    return NextResponse.json(po)
  } catch (error) {
    console.error("Error creating purchase order:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
