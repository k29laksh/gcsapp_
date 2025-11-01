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

    const po = await prisma.pO.findUnique({
      where: {
        id: params.id,
      },
      include: {
        vendor: true,
        project: true,
        items: true,
        bills: true,
      },
    })

    if (!po) {
      return new NextResponse(JSON.stringify({ message: "Purchase order not found" }), { status: 404 })
    }

    return NextResponse.json(po)
  } catch (error) {
    console.error("Error fetching purchase order:", error)
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

    // Check if PO exists
    const existingPO = await prisma.pO.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingPO) {
      return new NextResponse(JSON.stringify({ message: "Purchase order not found" }), { status: 404 })
    }

    // Delete existing items
    await prisma.pOItem.deleteMany({
      where: {
        poId: params.id,
      },
    })

    // Update PO
    const po = await prisma.pO.update({
      where: {
        id: params.id,
      },
      data: {
        poNumber: data.poNumber,
        date: data.date ? new Date(data.date) : undefined,
        vendorId: data.vendorId,
        projectId: data.projectId === "none" ? null : data.projectId,
        subtotal: Number.parseFloat(data.subtotal) || 0,
        tax: Number.parseFloat(data.tax) || 0,
        total: Number.parseFloat(data.total) || 0,
        notes: data.notes || "",
        status: data.status,
        items: {
          create: data.items.map((item: any) => ({
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
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "PO",
        entityId: po.id,
        description: `Updated purchase order: ${po.poNumber}`,
      },
    })

    return NextResponse.json(po)
  } catch (error) {
    console.error("Error updating purchase order:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    // Check if PO exists
    const existingPO = await prisma.pO.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingPO) {
      return new NextResponse(JSON.stringify({ message: "Purchase order not found" }), { status: 404 })
    }

    // Delete PO items first
    await prisma.pOItem.deleteMany({
      where: {
        poId: params.id,
      },
    })

    // Delete PO
    await prisma.pO.delete({
      where: {
        id: params.id,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entityType: "PO",
        entityId: params.id,
        description: `Deleted purchase order: ${existingPO.poNumber}`,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting purchase order:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
