import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    const { to, subject, htmlContent, attachments } = await req.json()

    // Brevo API configuration
    const brevoApiKey = process.env.BREVO_API_KEY
    if (!brevoApiKey) {
      throw new Error("Brevo API key not configured")
    }

    const emailData = {
      sender: {
        name: process.env.COMPANY_NAME || "Your Company",
        email: process.env.COMPANY_EMAIL || "noreply@yourcompany.com",
      },
      to: [{ email: to }],
      subject,
      htmlContent,
      ...(attachments && { attachment: attachments }),
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify(emailData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Brevo API error: ${error.message}`)
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    })
  } catch (error) {
    console.error("Error sending email:", error)
    return new NextResponse(
      JSON.stringify({
        message: "Failed to send email",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 },
    )
  }
}
