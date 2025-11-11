import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")
    const status = searchParams.get("status")

    const where: any = {}
    if (customerId) where.customerId = customerId
    if (status) where.status = status

    const deliveryChallans = await prisma.deliveryChallan.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(deliveryChallans)
  } catch (error) {
    console.error("Error fetching delivery challans:", error)
    return NextResponse.json({ error: "Failed to fetch delivery challans" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { challanNumber, date, customerId, items, notes, deliveryAddress } = body

    // Validate required fields
    if (!challanNumber || !date || !customerId || !items || items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    })

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Check if challan number already exists
    const existingChallan = await prisma.deliveryChallan.findUnique({
      where: { challanNumber },
    })

    if (existingChallan) {
      return NextResponse.json({ error: "Delivery challan number already exists" }, { status: 400 })
    }

    const deliveryChallan = await prisma.deliveryChallan.create({
      data: {
        challanNumber,
        date: new Date(date),
        customerId,
        deliveryAddress: deliveryAddress || null,
        notes: notes || null,
        status: "PENDING",
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: Number.parseInt(item.quantity),
            unit: item.unit || "PCS",
            remarks: item.remarks || null,
          })),
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
        items: true,
      },
    })

    return NextResponse.json(deliveryChallan, { status: 201 })
  } catch (error) {
    console.error("Error creating delivery challan:", error)
    return NextResponse.json({ error: "Failed to create delivery challan" }, { status: 500 })
  }
}
