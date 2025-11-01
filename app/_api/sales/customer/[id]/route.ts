import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        contacts: true,
        billingAddress: true,
        shippingAddress: true,
      },
    })

    if (!customer) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error("Error fetching customer:", error)
    return NextResponse.json({ message: "Failed to fetch customer" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Update customer with addresses and contacts
    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        customerType: data.customerType,
        companyName: data.companyName,
        gstNumber: data.gstNumber,
        panNumber: data.panNumber,
        gstState: data.gstState,
        gstType: data.gstType,
        creditTerms: data.creditTerms,
        creditLimit: data.creditLimit,
        contacts: {
          deleteMany: {},
          create:
            data.contacts?.map((contact: any) => ({
              title: contact.title,
              firstName: contact.firstName,
              lastName: contact.lastName,
              designation: contact.designation,
              email: contact.email,
              phone: contact.phone,
              alternatePhone: contact.alternatePhone,
              isPrimary: contact.isPrimary,
              notes: contact.notes,
            })) || [],
        },
      },
      include: {
        contacts: true,
        billingAddress: true,
        shippingAddress: true,
      },
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error("Error updating customer:", error)
    return NextResponse.json({ message: "Failed to update customer" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await prisma.customer.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Customer deleted successfully" })
  } catch (error) {
    console.error("Error deleting customer:", error)
    return NextResponse.json({ message: "Failed to delete customer" }, { status: 500 })
  }
}
