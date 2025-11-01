import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get query parameters
    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const customerId = url.searchParams.get("customerId");
    const status = url.searchParams.get("status");

    // Build filter object
    const filter: any = {};

    // Add date range filter if provided
    if (from && to) {
      filter.date = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }

    // Add customer filter if provided
    if (customerId && customerId !== "ALL") {
      filter.customerId = customerId;
    }

    // Add status filter if provided
    if (status && status !== "ALL") {
      filter.status = status;
    }

    // Get invoices with customer details
    const invoices = await prisma.invoice.findMany({
      where: filter,
      include: {
        customer: {
          include: {
            billingAddress: true,
            contacts: true,
          },
        },
        project: true,
        items: true,
        payments: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    console.log("Fetched invoices:", invoices.length); // Debug log

    // Transform data to ensure all numeric fields are properly formatted
    const transformedInvoices = invoices.map((invoice) => ({
      ...invoice,
      subtotal: Number(invoice.subtotal) || 0,
      tax: Number(invoice.tax) || 0,
      total: Number(invoice.total) || 0,
      cgst: Number(invoice.cgst) || 0,
      sgst: Number(invoice.sgst) || 0,
      igst: Number(invoice.igst) || 0,
      discountAmount: Number(invoice.discountAmount) || 0,
      shippingAmount: Number(invoice.shippingAmount) || 0,
      adjustmentAmount: Number(invoice.adjustmentAmount) || 0,
      totalAmount: Number(invoice.total) || 0,
      invoiceDate: invoice.date,
      customer: {
        ...invoice.customer,
        name:
          invoice.customer?.companyName ||
          `${invoice.customer?.firstName || ""} ${
            invoice.customer?.lastName || ""
          }`.trim(),
      },
      payments: invoice.payments.map((payment) => ({
        ...payment,
        amount: Number(payment.amount) || 0,
      })),
    }));

    return NextResponse.json(transformedInvoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await req.json();
    console.log("Creating invoice with data:", data);

    // Validate required fields
    if (!data.customerId) {
      return new NextResponse("Customer is required", { status: 400 });
    }

    if (!data.items || data.items.length === 0) {
      return new NextResponse("At least one item is required", { status: 400 });
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      return new NextResponse("Customer not found", { status: 400 });
    }

    // Verify project exists if provided
    if (data.projectId && data.projectId !== "__none__") {
      const project = await prisma.project.findUnique({
        where: { id: Number.parseInt(data.projectId) },
      });

      if (!project) {
        return new NextResponse("Project not found", { status: 400 });
      }
    }

    // Prepare invoice data
    const invoiceData: any = {
      invoiceNumber: data.invoiceNumber,
      date: new Date(data.invoiceDate || data.date),
      dueDate: new Date(data.dueDate),
      customerId: data.customerId,
      projectId:
        data.projectId === "__none__"
          ? null
          : data.projectId
          ? Number.parseInt(data.projectId)
          : null,
      subtotal: Number(data.subtotal) || 0,
      cgst: Number(data.cgst) || 0,
      sgst: Number(data.sgst) || 0,
      igst: Number(data.igst) || 0,
      tax: Number(data.tax || data.taxAmount) || 0,
      total: Number(data.totalAmount || data.total) || 0,
      notes: data.notes || "",
      termsAndConditions: data.termsAndConditions || data.terms || "",
      status: data.status || "DRAFT",
      poNumber: data.poNumber || "",
      vesselName: data.vesselName || "",
      placeOfSupply: data.placeOfSupply || "",
      ourReference: data.ourReference || "",
      paymentTerms: data.paymentTerms || "Net 30",
      paymentDue: Number(data.paymentDue) || 30,
      isRecurring: data.isRecurring || false,
      recurringFrequency: data.recurringFrequency || null,
      recurringEndDate: data.recurringEndDate
        ? new Date(data.recurringEndDate)
        : null,
      discountType: data.discountType || "PERCENTAGE",
      discountValue: Number(data.discountValue) || 0,
      discountAmount: Number(data.discountAmount) || 0,
      shippingAmount: Number(data.shippingAmount) || 0,
      adjustmentLabel: data.adjustmentLabel || "",
      adjustmentAmount: Number(data.adjustmentAmount) || 0,
      contactPerson: data.contactPerson || "",
      items: {
        create: (data.items || []).map((item: any) => ({
          description: item.description || item.name,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          tax: Number(item.tax) || 0,
          total: Number(item.amount || item.total) || 0,
          hsn: item.hsn || "",
          sacCode: item.sacCode || "",
        })),
      },
    };

    console.log("Prepared invoice data:", invoiceData);

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: invoiceData,
      include: {
        customer: true,
        project: true,
        items: true,
      },
    });

    console.log("Invoice created successfully:", invoice.id);

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error("Error creating invoice:", error);

    // Provide more specific error messages
    if (error.code === "P2003") {
      if (error.meta?.field_name?.includes("customerId")) {
        return new NextResponse(
          "Invalid customer selected. Please select a valid customer.",
          { status: 400 }
        );
      }
      if (error.meta?.field_name?.includes("projectId")) {
        return new NextResponse(
          "Invalid project selected. Please select a valid project.",
          { status: 400 }
        );
      }
    }

    if (error.code === "P2002") {
      return new NextResponse(
        "Invoice number already exists. Please use a different invoice number.",
        { status: 400 }
      );
    }

    return new NextResponse(`Failed to create invoice: ${error.message}`, {
      status: 500,
    });
  }
}
