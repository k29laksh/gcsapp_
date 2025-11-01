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

    const quotation = await prisma.quotation.findUnique({
      where: {
        id: params.id,
      },
      include: {
        customer: true,
        items: true,
      },
    })

    if (!quotation) {
      return new NextResponse(JSON.stringify({ message: "Quotation not found" }), { status: 404 })
    }

    return NextResponse.json(quotation)
  } catch (error) {
    console.error("Error fetching quotation:", error)
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

    // Check if quotation exists
    const existingQuotation = await prisma.quotation.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingQuotation) {
      return new NextResponse(JSON.stringify({ message: "Quotation not found" }), { status: 404 })
    }

    // Use transaction to ensure data consistency
    const quotation = await prisma.$transaction(async (tx) => {
      // Delete existing items first
      await tx.quotationItem.deleteMany({
        where: {
          quotationId: params.id,
        },
      })

      // Update quotation
      const updatedQuotation = await tx.quotation.update({
        where: {
          id: params.id,
        },
        data: {
          customerId: data.customerId,
          quotationDate: new Date(data.quotationDate),
          validUntil: new Date(data.validUntil),
          status: data.status,
          subtotal: data.subtotal,
          taxAmount: data.taxAmount,
          totalAmount: data.totalAmount,
          notes: data.notes,
          terms: data.terms,
        },
      })

      // Create new items if provided
      if (data.items && data.items.length > 0) {
        await tx.quotationItem.createMany({
          data: data.items.map((item: any) => ({
            quotationId: updatedQuotation.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        })
      }

      return updatedQuotation
    })

    return NextResponse.json(quotation)
  } catch (error) {
    console.error("Error updating quotation:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    // Check if quotation exists
    const existingQuotation = await prisma.quotation.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingQuotation) {
      return new NextResponse(JSON.stringify({ message: "Quotation not found" }), { status: 404 })
    }

    // Use transaction to ensure all related data is deleted properly
    await prisma.$transaction(async (tx) => {
      // First, delete all quotation items
      await tx.quotationItem.deleteMany({
        where: {
          quotationId: params.id,
        },
      })

      // Then delete the quotation itself
      await tx.quotation.delete({
        where: {
          id: params.id,
        },
      })
    })

    return new NextResponse(JSON.stringify({ message: "Quotation deleted successfully" }), { status: 200 })
  } catch (error) {
    console.error("Error deleting quotation:", error)

    // Check if it's a foreign key constraint error
    if (error.code === "P2003") {
      return new NextResponse(
        JSON.stringify({
          message: "Cannot delete quotation because it has related records. Please remove all related data first.",
        }),
        { status: 400 },
      )
    }

    return new NextResponse(
      JSON.stringify({
        message: "Failed to delete quotation",
        error: error.message,
      }),
      { status: 500 },
    )
  }
}
