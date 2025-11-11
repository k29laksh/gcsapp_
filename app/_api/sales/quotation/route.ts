import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const whereClause: any = {}

    if (from && to) {
      whereClause.date = {
        gte: new Date(from),
        lte: new Date(to),
      }
    }

    const quotations = await prisma.quotation.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            projectCode: true,
          },
        },
        vessel: {
          select: {
            id: true,
            vesselName: true,
            vesselType: true,
          },
        },
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Transform data to ensure proper structure
    const transformedQuotations = quotations.map((quotation) => ({
      ...quotation,
      customer: {
        ...quotation.customer,
        name:
          quotation.customer?.companyName ||
          `${quotation.customer?.firstName || ""} ${quotation.customer?.lastName || ""}`.trim(),
      },
      quotationDate: quotation.date,
      totalAmount: quotation.total,
    }))

    return NextResponse.json(transformedQuotations)
  } catch (error) {
    console.error("Error fetching quotations:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const {
      quotationNumber,
      date,
      validUntil,
      customerId,
      projectId,
      vesselId,
      items,
      subtotal,
      tax,
      total,
      notes,
      termsAndConditions,
      status,
      placeOfSupply,
      cgst,
      sgst,
      igst,
      discountType,
      discountValue,
      discountAmount,
      designScope,
      deliveryLocation,
      revisionRounds,
    } = body

    // Validate required fields
    if (!quotationNumber || !customerId || !items || items.length === 0) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Create quotation with items
    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        date: new Date(date),
        validUntil: new Date(validUntil),
        customerId,
        projectId: projectId === "__none__" || !projectId ? null : projectId,
        vesselId: vesselId || null,
        subtotal: Number.parseFloat(subtotal) || 0,
        tax: Number.parseFloat(tax) || 0,
        total: Number.parseFloat(total) || 0,
        notes: notes || "",
        termsAndConditions: termsAndConditions || "",
        status: status || "DRAFT",
        placeOfSupply: placeOfSupply || "",
        cgst: Number.parseFloat(cgst) || 0,
        sgst: Number.parseFloat(sgst) || 0,
        igst: Number.parseFloat(igst) || 0,
        designScope: designScope || null,
        deliveryLocation: deliveryLocation || null,
        revisionRounds: revisionRounds ? Number.parseInt(revisionRounds) : null,
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: Number.parseFloat(item.quantity) || 1,
            unitPrice: Number.parseFloat(item.unitPrice) || 0,
            tax: Number.parseFloat(item.tax) || 0,
            total: Number.parseFloat(item.total) || 0,
            hsn: item.hsn || "",
            sacCode: item.sacCode || "",
            planType: item.planType || null,
            deliveryDays: item.deliveryDays ? Number.parseInt(item.deliveryDays) : null,
            revisions: item.revisions ? Number.parseInt(item.revisions) : null,
          })),
        },
      },
      include: {
        customer: true,
        project: true,
        vessel: true,
        items: true,
      },
    })

    return NextResponse.json(quotation)
  } catch (error) {
    console.error("Error creating quotation:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
