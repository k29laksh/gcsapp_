import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const customers = await prisma.customer.findMany({
      include: {
        contacts: true,
        billingAddress: true,
        shippingAddress: true,
        _count: {
          select: {
            projects: true,
            quotations: true,
            invoices: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { message: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Create customer with addresses and contacts
    const customer = await prisma.customer.create({
      data: {
        customerType: data.customerType,
        companyName: data.companyName,
        gstNumber: data.gstNumber,
        panNumber: data.panNumber,
        gstState: data.gstState,
        gstType: data.gstType,
        creditTerms: data.creditTerms,
        creditLimit: data.creditLimit,
        billingAddress: data.billingAddress
          ? {
              create: data.billingAddress,
            }
          : undefined,
        shippingAddress:
          data.shippingAddress && !data.sameAsBilling
            ? {
                create: data.shippingAddress,
              }
            : undefined,
        contacts: {
          create: data.contacts || [],
        },
      },
      include: {
        contacts: true,
        billingAddress: true,
        shippingAddress: true,
      },
    });

    // If same as billing, link shipping address to billing address
    if (data.sameAsBilling && customer.billingAddressId) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          shippingAddressId: customer.billingAddressId,
        },
      });
    }

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { message: "Failed to create customer" },
      { status: 500 }
    );
  }
}
