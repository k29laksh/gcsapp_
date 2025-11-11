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

    const bills = await prisma.bill.findMany({
      include: {
        vendor: true,
        po: true,
        items: true,
        payments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(bills)
  } catch (error) {
    console.error("Error fetching bills:", error)
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
    if (!body.billNumber || !body.vendorId || !body.items || body.items.length === 0) {
      return new NextResponse(
        JSON.stringify({ message: "Missing required fields: billNumber, vendorId, and items are required" }),
        { status: 400 },
      )
    }

    // Calculate amount due
    const amountDue = (body.total || 0) - (body.amountPaid || 0)

    // Create bill with items
    const bill = await prisma.bill.create({
      data: {
        billNumber: body.billNumber,
        date: body.date ? new Date(body.date) : new Date(),
        dueDate: body.dueDate ? new Date(body.dueDate) : new Date(),
        vendorId: body.vendorId,
        poId: body.poId === "none" ? null : body.poId,
        subtotal: Number.parseFloat(body.subtotal) || 0,
        tax: Number.parseFloat(body.tax) || 0,
        total: Number.parseFloat(body.total) || 0,
        amountPaid: Number.parseFloat(body.amountPaid) || 0,
        amountDue: amountDue,
        notes: body.notes || "",
        status: body.status || "UNPAID",
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
        po: true,
        items: true,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "BILL",
        entityId: bill.id,
        description: `Created bill: ${bill.billNumber}`,
      },
    })

    return NextResponse.json(bill)
  } catch (error) {
    console.error("Error creating bill:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
