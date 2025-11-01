import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    // For demonstration purposes, we'll generate some notifications based on system data
    const notifications = [];

    // Check for overdue invoices
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: "SENT",
        dueDate: {
          lt: new Date(),
        },
      },
      take: 5,
      orderBy: {
        dueDate: "asc",
      },
    });

    for (const invoice of overdueInvoices) {
      notifications.push({
        id: `invoice-overdue-${invoice.id}`,
        title: "Overdue Invoice",
        message: `Invoice ${invoice.invoiceNumber} is overdue since ${new Date(
          invoice.dueDate
        ).toLocaleDateString()}`,
        read: false,
        date: new Date(),
        type: "warning",
      });
    }

    // Check for low inventory (this would require an inventory model, which we don't have in this schema)
    // For demonstration, we'll add a placeholder notification

    notifications.push({
      id: "inventory-low-demo",
      title: "Low Inventory Alert",
      message:
        "Some items are running low on inventory. Please check the inventory report.",
      read: false,
      date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      type: "warning",
    });

    // Check for new inquiries
    const recentInquiries = await prisma.inquiry.findMany({
      where: {
        status: "NEW",
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      take: 3,
      orderBy: {
        createdAt: "desc",
      },
    });

    for (const inquiry of recentInquiries) {
      notifications.push({
        id: `inquiry-new-${inquiry.id}`,
        title: "New Inquiry",
        message: `New inquiry received: ${inquiry.subject}`,
        read: false,
        date: new Date(inquiry.createdAt),
        type: "info",
      });
    }

    // Add some system notifications
    notifications.push({
      id: "system-update",
      title: "System Update",
      message: "The system will undergo maintenance tonight at 2:00 AM UTC.",
      read: true,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      type: "info",
    });

    // Sort notifications by date (newest first)
    notifications.sort((a, b) => b.date.getTime() - a.date.getTime());

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return new NextResponse(
      JSON.stringify({ message: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
