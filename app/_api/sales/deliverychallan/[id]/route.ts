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

    const deliveryChallan = await prisma.deliveryChallan.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          include: {
            contacts: true,
            billingAddress: true,
            shippingAddress: true,
          },
        },
        items: true,
      },
    })

    if (!deliveryChallan) {
      return NextResponse.json({ error: "Delivery challan not found" }, { status: 404 })
    }

    return NextResponse.json(deliveryChallan)
  } catch (error) {
    console.error("Error fetching delivery challan:", error)
    return NextResponse.json({ error: "Failed to fetch delivery challan" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { challanNumber, date, customerId, items, notes, deliveryAddress, status } = body

    // Check if delivery challan exists
    const existingChallan = await prisma.deliveryChallan.findUnique({
      where: { id: params.id },
    })

    if (!existingChallan) {
      return NextResponse.json({ error: "Delivery challan not found" }, { status: 404 })
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

    const deliveryChallan = await prisma.deliveryChallan.update({
      where: { id: params.id },
      data: {
        ...(challanNumber && { challanNumber }),
        ...(date && { date: new Date(date) }),
        ...(customerId && { customerId }),
        ...(deliveryAddress !== undefined && { deliveryAddress: deliveryAddress || null }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(status && { status }),
        ...(items && {
          items: {
            deleteMany: {},
            create: items.map((item: any) => ({
              description: item.description,
              quantity: Number.parseInt(item.quantity),
              unit: item.unit || "PCS",
              remarks: item.remarks || null,
            })),
          },
        }),
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

    return NextResponse.json(deliveryChallan)
  } catch (error) {
    console.error("Error updating delivery challan:", error)
    return NextResponse.json({ error: "Failed to update delivery challan" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if delivery challan exists
    const existingChallan = await prisma.deliveryChallan.findUnique({
      where: { id: params.id },
    })

    if (!existingChallan) {
      return NextResponse.json({ error: "Delivery challan not found" }, { status: 404 })
    }

    await prisma.deliveryChallan.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Delivery challan deleted successfully" })
  } catch (error) {
    console.error("Error deleting delivery challan:", error)
    return NextResponse.json({ error: "Failed to delete delivery challan" }, { status: 500 })
  }
}
