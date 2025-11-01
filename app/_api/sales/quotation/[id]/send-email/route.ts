import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    const { id } = params
    const { recipientEmail, message } = await req.json()

    // Fetch quotation details
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    })

    if (!quotation) {
      return new NextResponse(JSON.stringify({ message: "Quotation not found" }), { status: 404 })
    }

    // Generate PDF content (simplified)
    const pdfContent = `
      QUOTATION: ${quotation.quotationNumber}
      
      Customer: ${quotation.customer.companyName || `${quotation.customer.firstName} ${quotation.customer.lastName}`}
      Date: ${new Date(quotation.date).toLocaleDateString()}
      Valid Until: ${new Date(quotation.validUntil).toLocaleDateString()}
      
      Items:
      ${quotation.items.map((item) => `- ${item.description}: ${item.quantity} x ₹${item.unitPrice} = ₹${item.total}`).join("\n")}
      
      Total: ₹${quotation.total}
    `

    // Create HTML email content
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50;">Quotation - ${quotation.quotationNumber}</h2>
            
            <p>Dear ${quotation.customer.companyName || `${quotation.customer.firstName} ${quotation.customer.lastName}`},</p>
            
            <p>${message || "Please find attached our quotation for your review."}</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Quotation Details:</h3>
              <p><strong>Quotation Number:</strong> ${quotation.quotationNumber}</p>
              <p><strong>Date:</strong> ${new Date(quotation.date).toLocaleDateString()}</p>
              <p><strong>Valid Until:</strong> ${new Date(quotation.validUntil).toLocaleDateString()}</p>
              <p><strong>Total Amount:</strong> ₹${quotation.total.toLocaleString()}</p>
            </div>
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>
            ${process.env.COMPANY_NAME || "Your Company"}</p>
          </div>
        </body>
      </html>
    `

    // Send email via Brevo
    const emailResponse = await fetch(`${req.url.split("/api")[0]}/api/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: req.headers.get("cookie") || "",
      },
      body: JSON.stringify({
        to: recipientEmail,
        subject: `Quotation ${quotation.quotationNumber} from ${process.env.COMPANY_NAME || "Your Company"}`,
        htmlContent,
        attachments: [
          {
            name: `Quotation-${quotation.quotationNumber}.txt`,
            content: Buffer.from(pdfContent).toString("base64"),
          },
        ],
      }),
    })

    if (!emailResponse.ok) {
      throw new Error("Failed to send email")
    }

    // Update quotation status to SENT
    await prisma.quotation.update({
      where: { id },
      data: { status: "SENT" },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "EMAIL_SENT",
        entityType: "QUOTATION",
        entityId: quotation.id,
        details: `Sent quotation ${quotation.quotationNumber} to ${recipientEmail}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Quotation sent successfully",
    })
  } catch (error) {
    console.error("Error sending quotation email:", error)
    return new NextResponse(
      JSON.stringify({
        message: "Failed to send quotation",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 },
    )
  }
}
