import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = params

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            billingAddress: true,
            shippingAddress: true,
            contacts: true,
          },
        },
        project: true,
        items: true,
        payments: true,
      },
    })

    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 })
    }

    // Transform data to ensure proper number formatting
    const transformedInvoice = {
      ...invoice,
      subtotal: Number(invoice.subtotal?.toString() || "0"),
      tax: Number(invoice.tax?.toString() || "0"),
      total: Number(invoice.total?.toString() || "0"),
      cgst: Number(invoice.cgst?.toString() || "0"),
      sgst: Number(invoice.sgst?.toString() || "0"),
      igst: Number(invoice.igst?.toString() || "0"),
      discountAmount: Number(invoice.discountAmount?.toString() || "0"),
      shippingAmount: Number(invoice.shippingAmount?.toString() || "0"),
      adjustmentAmount: Number(invoice.adjustmentAmount?.toString() || "0"),
      invoiceDate: invoice.date,
      dueDate: invoice.dueDate,
      totalAmount: Number(invoice.total?.toString() || "0"),
      taxAmount: Number(invoice.tax?.toString() || "0"),
      taxRate: 18, // Default tax rate
      items:
        invoice.items?.map((item) => ({
          ...item,
          name: item.description,
          description: item.description,
          quantity: Number(item.quantity?.toString() || "1"),
          unitPrice: Number(item.unitPrice?.toString() || "0"),
          taxRate: Number(item.tax?.toString() || "0"),
          tax: Number(item.tax?.toString() || "0"),
          amount: Number(item.total?.toString() || "0"),
          total: Number(item.total?.toString() || "0"),
        })) || [],
      customer: {
        ...invoice.customer,
        name:
          invoice.customer?.companyName ||
          `${invoice.customer?.firstName || ""} ${invoice.customer?.lastName || ""}`.trim(),
      },
    }

    return NextResponse.json(transformedInvoice)
  } catch (error) {
    console.error("Error fetching invoice:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = params
    const body = await req.json()

    console.log("Updating invoice with data:", body)

    // Validate required fields
    if (!body.customerId) {
      return new NextResponse("Customer is required", { status: 400 })
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: body.customerId },
    })

    if (!customer) {
      return new NextResponse("Customer not found", { status: 400 })
    }

    // Use transaction to ensure data consistency
    const invoice = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id },
      })

      // Update invoice with new data
      return await tx.invoice.update({
        where: { id },
        data: {
          invoiceNumber: body.invoiceNumber,
          date: new Date(body.invoiceDate || body.date),
          dueDate: new Date(body.dueDate),
          customerId: body.customerId,
          projectId: body.projectId === "__none__" ? null : body.projectId ? Number.parseInt(body.projectId) : null,
          subtotal: Number(body.subtotal) || 0,
          tax: Number(body.taxAmount || body.tax) || 0,
          total: Number(body.totalAmount || body.total) || 0,
          notes: body.notes || "",
          termsAndConditions: body.termsAndConditions || body.terms || "",
          status: body.status || "DRAFT",
          poNumber: body.poNumber || "",
          vesselName: body.vesselName || "",
          placeOfSupply: body.placeOfSupply || "",
          ourReference: body.ourReference || "",
          cgst: Number(body.cgst) || 0,
          sgst: Number(body.sgst) || 0,
          igst: Number(body.igst) || 0,
          paymentTerms: body.paymentTerms || "Net 30",
          paymentDue: Number(body.paymentDue) || 30,
          discountType: body.discountType || "PERCENTAGE",
          discountValue: Number(body.discountValue) || 0,
          discountAmount: Number(body.discountAmount) || 0,
          shippingAmount: Number(body.shippingAmount) || 0,
          adjustmentLabel: body.adjustmentLabel || "",
          adjustmentAmount: Number(body.adjustmentAmount) || 0,
          contactPerson: body.contactPerson || "",
          items: {
            create: (body.items || []).map((item: any) => ({
              description: item.description || item.name,
              quantity: Number(item.quantity) || 1,
              unitPrice: Number(item.unitPrice) || 0,
              tax: Number(item.tax) || 0,
              total: Number(item.amount || item.total) || 0,
              hsn: item.hsn || "",
              sacCode: item.sacCode || "",
            })),
          },
        },
        include: {
          customer: true,
          project: true,
          items: true,
        },
      })
    })

    console.log("Invoice updated successfully:", invoice.id)

    return NextResponse.json(invoice)
  } catch (error) {
    console.error("Error updating invoice:", error)
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = params

    // Check if invoice exists first
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    })

    if (!existingInvoice) {
      return new NextResponse("Invoice not found", { status: 404 })
    }

    // Use transaction to ensure all deletions succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Delete related records first (foreign key constraints)
      await tx.payment.deleteMany({
        where: { invoiceId: id },
      })

      await tx.customerPayment.deleteMany({
        where: { invoiceId: id },
      })

      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id },
      })

      // Finally delete the invoice
      await tx.invoice.delete({
        where: { id },
      })
    })

    console.log("Invoice deleted successfully:", id)

    return NextResponse.json({ message: "Invoice deleted successfully" })
  } catch (error) {
    console.error("Error deleting invoice:", error)

    // Check if it's a foreign key constraint error
    if (error.code === "P2003") {
      return new NextResponse(
        JSON.stringify({
          message: "Cannot delete invoice because it has related records. Please remove all related data first.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    return new NextResponse(
      JSON.stringify({
        message: "Failed to delete invoice",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
