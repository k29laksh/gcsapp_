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

    const creditNote = await prisma.creditNote.findUnique({
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

    if (!creditNote) {
      return NextResponse.json({ error: "Credit note not found" }, { status: 404 })
    }

    return NextResponse.json(creditNote)
  } catch (error) {
    console.error("Error fetching credit note:", error)
    return NextResponse.json({ error: "Failed to fetch credit note" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { creditNumber, date, customerId, amount, reason, reference, notes, status } = body

    // Check if credit note exists
    const existingCreditNote = await prisma.creditNote.findUnique({
      where: { id: params.id },
    })

    if (!existingCreditNote) {
      return NextResponse.json({ error: "Credit note not found" }, { status: 404 })
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

    const creditNote = await prisma.creditNote.update({
      where: { id: params.id },
      data: {
        ...(creditNumber && { creditNumber }),
        ...(date && { date: new Date(date) }),
        ...(customerId && { customerId }),
        ...(amount && { amount: Number.parseFloat(amount) }),
        ...(reason && { reason }),
        ...(reference !== undefined && { reference: reference || null }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(status && { status }),
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

    return NextResponse.json(creditNote)
  } catch (error) {
    console.error("Error updating credit note:", error)
    return NextResponse.json({ error: "Failed to update credit note" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if credit note exists
    const existingCreditNote = await prisma.creditNote.findUnique({
      where: { id: params.id },
    })

    if (!existingCreditNote) {
      return NextResponse.json({ error: "Credit note not found" }, { status: 404 })
    }

    await prisma.creditNote.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Credit note deleted successfully" })
  } catch (error) {
    console.error("Error deleting credit note:", error)
    return NextResponse.json({ error: "Failed to delete credit note" }, { status: 500 })
  }
}
