import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Get the original quotation
    const originalQuotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        items: true,
      },
    })

    if (!originalQuotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    // Generate new quotation number
    const lastQuotation = await prisma.quotation.findFirst({
      orderBy: { quotationNumber: "desc" },
    })

    let nextNumber = 1
    if (lastQuotation?.quotationNumber) {
      const match = lastQuotation.quotationNumber.match(/QUO-(\d+)/)
      if (match) {
        nextNumber = Number.parseInt(match[1]) + 1
      }
    }

    const quotationNumber = `QUO-${nextNumber.toString().padStart(4, "0")}`

    // Create duplicate quotation
    const duplicateQuotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        date: new Date(),
        validUntil: originalQuotation.validUntil,
        customerId: originalQuotation.customerId,
        projectId: originalQuotation.projectId,
        subtotal: originalQuotation.subtotal,
        tax: originalQuotation.tax,
        total: originalQuotation.total,
        status: "DRAFT",
        notes: originalQuotation.notes,
        terms: originalQuotation.terms,
        items: {
          create: originalQuotation.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount,
          })),
        },
      },
      include: {
        customer: true,
        project: true,
        items: true,
      },
    })

    return NextResponse.json(duplicateQuotation)
  } catch (error) {
    console.error("Error duplicating quotation:", error)
    return NextResponse.json({ error: "Failed to duplicate quotation" }, { status: 500 })
  }
}
