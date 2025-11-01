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

    const bill = await prisma.bill.findUnique({
      where: {
        id: params.id,
      },
      include: {
        vendor: true,
        po: true,
        items: true,
        payments: true,
      },
    })

    if (!bill) {
      return new NextResponse(JSON.stringify({ message: "Bill not found" }), { status: 404 })
    }

    return NextResponse.json(bill)
  } catch (error) {
    console.error("Error fetching bill:", error)
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

    // Check if bill exists
    const existingBill = await prisma.bill.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingBill) {
      return new NextResponse(JSON.stringify({ message: "Bill not found" }), { status: 404 })
    }

    // Calculate amount due
    const amountDue = (data.total || 0) - (data.amountPaid || 0)

    // Delete existing items
    await prisma.billItem.deleteMany({
      where: {
        billId: params.id,
      },
    })

    // Update bill
    const bill = await prisma.bill.update({
      where: {
        id: params.id,
      },
      data: {
        billNumber: data.billNumber,
        date: data.date ? new Date(data.date) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        vendorId: data.vendorId,
        poId: data.poId === "none" ? null : data.poId,
        subtotal: Number.parseFloat(data.subtotal) || 0,
        tax: Number.parseFloat(data.tax) || 0,
        total: Number.parseFloat(data.total) || 0,
        amountPaid: Number.parseFloat(data.amountPaid) || 0,
        amountDue: amountDue,
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
        entityType: "BILL",
        entityId: bill.id,
        description: `Updated bill: ${bill.billNumber}`,
      },
    })

    return NextResponse.json(bill)
  } catch (error) {
    console.error("Error updating bill:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    // Check if bill exists
    const existingBill = await prisma.bill.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingBill) {
      return new NextResponse(JSON.stringify({ message: "Bill not found" }), { status: 404 })
    }

    // Delete bill items first
    await prisma.billItem.deleteMany({
      where: {
        billId: params.id,
      },
    })

    // Delete bill
    await prisma.bill.delete({
      where: {
        id: params.id,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entityType: "BILL",
        entityId: params.id,
        description: `Deleted bill: ${existingBill.billNumber}`,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting bill:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
