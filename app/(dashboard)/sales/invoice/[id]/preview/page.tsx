"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Printer, Edit, Send } from "lucide-react"
import { CompanyHeader } from "@/components/company-header"
import { CompanyFooter } from "@/components/company-footer"
import { numberToWords } from "@/lib/number-to-words"
import { useToast } from "@/hooks/use-toast"

export default function InvoicePreviewPage() {
  const [invoice, setInvoice] = useState<any>(null)
  const [companyProfile, setCompanyProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const invoiceId = params.id as string

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch invoice data
        const invoiceResponse = await fetch(`/api/sales/invoice/${invoiceId}`)
        if (invoiceResponse.ok) {
          const invoiceData = await invoiceResponse.json()
          setInvoice(invoiceData)
        }

        // Fetch company profile
        const companyResponse = await fetch("/api/settings/company-profile")
        if (companyResponse.ok) {
          const companyData = await companyResponse.json()
          setCompanyProfile(companyData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load invoice data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [invoiceId, toast])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handlePrint = () => {
    window.open(`/sales/invoice/${invoiceId}/print`, "_blank")
  }

  const handleEdit = () => {
    router.push(`/sales/invoice/${invoiceId}/edit`)
  }

  const handleSend = async () => {
    try {
      const response = await fetch(`/api/sales/invoice/${invoiceId}/send`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to send invoice")

      toast({
        title: "Success",
        description: "Invoice sent successfully",
      })

      // Refresh invoice data
      const invoiceResponse = await fetch(`/api/sales/invoice/${invoiceId}`)
      if (invoiceResponse.ok) {
        const invoiceData = await invoiceResponse.json()
        setInvoice(invoiceData)
      }
    } catch (error) {
      console.error("Error sending invoice:", error)
      toast({
        title: "Error",
        description: "Failed to send invoice",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading invoice preview...</p>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Invoice not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>

            {invoice.status === "DRAFT" && (
              <Button variant="outline" onClick={handleSend}>
                <Send className="mr-2 h-4 w-4" />
                Send
              </Button>
            )}

            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        {/* Invoice Preview */}
        <Card>
          <CardContent className="p-8">
            <div className="space-y-8">
              {/* Company Header */}
              <CompanyHeader companyProfile={companyProfile} />

              {/* Invoice Title */}
              <div className="text-center">
                <h1 className="text-3xl font-bold text-primary">INVOICE</h1>
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-4">Bill To:</h3>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {invoice.customer?.name ||
                        invoice.customer?.companyName ||
                        `${invoice.customer?.firstName || ""} ${invoice.customer?.lastName || ""}`.trim()}
                    </p>
                    <p>{invoice.customer?.addressLine1}</p>
                    {invoice.customer?.addressLine2 && <p>{invoice.customer.addressLine2}</p>}
                    <p>
                      {invoice.customer?.city}, {invoice.customer?.state} {invoice.customer?.postalCode}
                    </p>
                    <p>{invoice.customer?.country}</p>
                    {invoice.customer?.gstin && <p>GSTIN: {invoice.customer.gstin}</p>}
                  </div>
                </div>

                <div className="text-right">
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Invoice Number: </span>
                      <span>{invoice.invoiceNumber}</span>
                    </div>
                    <div>
                      <span className="font-medium">Invoice Date: </span>
                      <span>{formatDate(invoice.invoiceDate || invoice.date)}</span>
                    </div>
                    <div>
                      <span className="font-medium">Due Date: </span>
                      <span>{formatDate(invoice.dueDate)}</span>
                    </div>
                    {invoice.poNumber && (
                      <div>
                        <span className="font-medium">P.O. Number: </span>
                        <span>{invoice.poNumber}</span>
                      </div>
                    )}
                    {invoice.vesselName && (
                      <div>
                        <span className="font-medium">Vessel Name: </span>
                        <span>{invoice.vesselName}</span>
                      </div>
                    )}
                    {invoice.ourReference && (
                      <div>
                        <span className="font-medium">Our Reference: </span>
                        <span>{invoice.ourReference}</span>
                      </div>
                    )}
                    {invoice.contactPerson && (
                      <div>
                        <span className="font-medium">Contact Person: </span>
                        <span>{invoice.contactPerson}</span>
                      </div>
                    )}
                    {invoice.placeOfSupply && (
                      <div>
                        <span className="font-medium">Place of Supply: </span>
                        <span>{invoice.placeOfSupply}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">S.No.</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Description of Goods/Services</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">HSN/SAC</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Qty</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Unit Price</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items?.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                        <td className="border border-gray-300 px-4 py-2">{item.description}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {item.hsn || item.sacCode || "-"}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals Section */}
                <div className="flex justify-end mt-4">
                  <div className="w-80">
                    <table className="w-full border-collapse border border-gray-300">
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-medium">Subtotal</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">
                            {formatCurrency(invoice.subtotal)}
                          </td>
                        </tr>

                        {invoice.cgst > 0 && (
                          <tr>
                            <td className="border border-gray-300 px-4 py-2">CGST (9%)</td>
                            <td className="border border-gray-300 px-4 py-2 text-right">
                              {formatCurrency(invoice.cgst)}
                            </td>
                          </tr>
                        )}

                        {invoice.sgst > 0 && (
                          <tr>
                            <td className="border border-gray-300 px-4 py-2">SGST (9%)</td>
                            <td className="border border-gray-300 px-4 py-2 text-right">
                              {formatCurrency(invoice.sgst)}
                            </td>
                          </tr>
                        )}

                        {invoice.igst > 0 && (
                          <tr>
                            <td className="border border-gray-300 px-4 py-2">IGST (18%)</td>
                            <td className="border border-gray-300 px-4 py-2 text-right">
                              {formatCurrency(invoice.igst)}
                            </td>
                          </tr>
                        )}

                        <tr className="bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2 font-bold">Total Amount</td>
                          <td className="border border-gray-300 px-4 py-2 text-right font-bold">
                            {formatCurrency(invoice.total)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Amount in Words */}
                <div className="mt-4">
                  <p className="font-medium">
                    Amount in Words: <span className="capitalize">{numberToWords(invoice.total)} Rupees Only</span>
                  </p>
                </div>
              </div>

              {/* Notes and Terms */}
              {(invoice.notes || invoice.termsAndConditions) && (
                <div className="space-y-4">
                  {invoice.notes && (
                    <div>
                      <h3 className="font-semibold mb-2">Notes:</h3>
                      <p className="text-sm">{invoice.notes}</p>
                    </div>
                  )}

                  {invoice.termsAndConditions && (
                    <div>
                      <h3 className="font-semibold mb-2">Terms & Conditions:</h3>
                      <p className="text-sm whitespace-pre-line">{invoice.termsAndConditions}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Company Footer */}
              <CompanyFooter companyProfile={companyProfile} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
