import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payment = await prisma.customerPayment.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          include: {
            contacts: true,
            billingAddress: true,
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: "Customer payment not found" }, { status: 404 })
    }

    return NextResponse.json(payment)
  } catch (error) {
    console.error("Error fetching customer payment:", error)
    return NextResponse.json({ error: "Failed to fetch customer payment" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { date, customerId, amount, method, reference, notes } = body

    // Check if payment exists
    const existingPayment = await prisma.customerPayment.findUnique({
      where: { id: params.id },
    })

    if (!existingPayment) {
      return NextResponse.json({ error: "Customer payment not found" }, { status: 404 })
    }

    // Check if customer exists
    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      })

      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 })
      }
    }

    const payment = await prisma.customerPayment.update({
      where: { id: params.id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(customerId && { customerId }),
        ...(amount && { amount: Number.parseFloat(amount) }),
        ...(method && { method }),
        ...(reference !== undefined && { reference: reference || null }),
        ...(notes !== undefined && { notes: notes || null }),
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

    return NextResponse.json(payment)
  } catch (error) {
    console.error("Error updating customer payment:", error)
    return NextResponse.json({ error: "Failed to update customer payment" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if payment exists
    const existingPayment = await prisma.customerPayment.findUnique({
      where: { id: params.id },
    })

    if (!existingPayment) {
      return NextResponse.json({ error: "Customer payment not found" }, { status: 404 })
    }

    await prisma.customerPayment.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Customer payment deleted successfully" })
  } catch (error) {
    console.error("Error deleting customer payment:", error)
    return NextResponse.json({ error: "Failed to delete customer payment" }, { status: 500 })
  }
}
