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

    const creditNotes = await prisma.creditNote.findMany({
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

    return NextResponse.json(creditNotes)
  } catch (error) {
    console.error("Error fetching credit notes:", error)
    return NextResponse.json({ error: "Failed to fetch credit notes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { creditNumber, date, customerId, amount, reason, reference, notes } = body

    // Validate required fields
    if (!creditNumber || !date || !customerId || !amount || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    })

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Check if credit number already exists
    const existingCreditNote = await prisma.creditNote.findUnique({
      where: { creditNumber },
    })

    if (existingCreditNote) {
      return NextResponse.json({ error: "Credit note number already exists" }, { status: 400 })
    }

    const creditNote = await prisma.creditNote.create({
      data: {
        creditNumber,
        date: new Date(date),
        customerId,
        amount: Number.parseFloat(amount),
        reason,
        reference: reference || null,
        notes: notes || null,
        status: "ISSUED",
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

    return NextResponse.json(creditNote, { status: 201 })
  } catch (error) {
    console.error("Error creating credit note:", error)
    return NextResponse.json({ error: "Failed to create credit note" }, { status: 500 })
  }
}
