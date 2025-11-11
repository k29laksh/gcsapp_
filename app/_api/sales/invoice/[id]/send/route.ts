import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check permission
    if (session.user.role !== "ADMIN" && !session.user.permissions?.includes("SEND_INVOICES")) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: params.id,
      },
      include: {
        customer: true,
      },
    })

    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 })
    }

    // Update invoice status to SENT
    const updatedInvoice = await prisma.invoice.update({
      where: {
        id: params.id,
      },
      data: {
        status: "SENT",
        sentDate: new Date(),
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "UPDATE",
        entityType: "INVOICE",
        entityId: invoice.id,
        description: `Invoice #${invoice.invoiceNumber} sent to customer`,
        userId: session.user.id,
      },
    })

    // Create notification for customer
    await prisma.notification.create({
      data: {
        title: "Invoice Sent",
        message: `Invoice #${invoice.invoiceNumber} has been sent to ${invoice.customer.companyName || `${invoice.customer.firstName} ${invoice.customer.lastName}`}`,
        type: "INVOICE",
        entityId: invoice.id,
        userId: null, // Send to all users
      },
    })

    // In a real application, you would send an email to the customer here
    // This is a placeholder for that functionality

    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error("Error sending invoice:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
