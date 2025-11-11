import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get total invoices count
    const totalInvoices = await prisma.invoice.count();

    // Get paid invoices
    const paidInvoices = await prisma.invoice.count({
      where: {
        status: "PAID",
      },
    });

    // Get pending invoices (SENT or DRAFT)
    const pendingInvoices = await prisma.invoice.count({
      where: {
        status: {
          in: ["SENT", "DRAFT"],
        },
      },
    });

    // Get overdue invoices
    const overdueInvoices = await prisma.invoice.count({
      where: {
        status: "OVERDUE",
      },
    });

    // Get total amount
    const totalAmountResult = await prisma.invoice.aggregate({
      _sum: {
        total: true,
      },
    });
    const totalAmount = Number(totalAmountResult._sum.total || 0);

    // Get paid amount
    const paidAmountResult = await prisma.invoice.aggregate({
      where: {
        status: "PAID",
      },
      _sum: {
        total: true,
      },
    });
    const paidAmount = Number(paidAmountResult._sum.total || 0);

    // Get pending amount
    const pendingAmountResult = await prisma.invoice.aggregate({
      where: {
        status: {
          in: ["SENT", "DRAFT"],
        },
      },
      _sum: {
        total: true,
      },
    });
    const pendingAmount = Number(pendingAmountResult._sum.total || 0);

    // Get overdue amount
    const overdueAmountResult = await prisma.invoice.aggregate({
      where: {
        status: "OVERDUE",
      },
      _sum: {
        total: true,
      },
    });
    const overdueAmount = Number(overdueAmountResult._sum.total || 0);

    return NextResponse.json({
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount,
    });
  } catch (error) {
    console.error("Error fetching invoice stats:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
