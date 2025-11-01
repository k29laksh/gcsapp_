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
    const method = searchParams.get("method")

    const where: any = {}
    if (customerId) where.customerId = customerId
    if (method) where.method = method

    const payments = await prisma.customerPayment.findMany({
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

    return NextResponse.json(payments)
  } catch (error) {
    console.error("Error fetching customer payments:", error)
    return NextResponse.json({ error: "Failed to fetch customer payments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { date, customerId, amount, method, reference, notes } = body

    // Validate required fields
    if (!date || !customerId || !amount || !method) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    })

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    const payment = await prisma.customerPayment.create({
      data: {
        date: new Date(date),
        customerId,
        amount: Number.parseFloat(amount),
        method,
        reference: reference || null,
        notes: notes || null,
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
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error("Error creating customer payment:", error)
    return NextResponse.json({ error: "Failed to create customer payment" }, { status: 500 })
  }
}
