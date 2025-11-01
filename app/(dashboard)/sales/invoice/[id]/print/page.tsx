"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { CompanyHeader } from "@/components/company-header"
import { CompanyFooter } from "@/components/company-footer"
import { numberToWords } from "@/lib/number-to-words"
import { Button } from "@/components/ui/button"
import { Download, Printer, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function InvoicePrintPage() {
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

          // Ensure numeric values are properly formatted
          const formattedInvoice = {
            ...invoiceData,
            subtotal: Number(invoiceData.subtotal) || 0,
            tax: Number(invoiceData.tax) || 0,
            total: Number(invoiceData.total) || 0,
            cgst: Number(invoiceData.cgst) || 0,
            sgst: Number(invoiceData.sgst) || 0,
            igst: Number(invoiceData.igst) || 0,
            discountAmount: Number(invoiceData.discountAmount) || 0,
            shippingAmount: Number(invoiceData.shippingAmount) || 0,
            adjustmentAmount: Number(invoiceData.adjustmentAmount) || 0,
          }

          setInvoice(formattedInvoice)
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

  const handleDownloadPDF = async () => {
    try {
      window.open(`/api/sales/invoice/${invoiceId}/pdf`, "_blank");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive",
      });
    }
  }

  if (isLoading || !invoice) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading invoice...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden flex justify-between items-center p-6 border-b bg-gray-50">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-4xl mx-auto p-8 print:p-0">
        {/* Company Header */}
        <CompanyHeader companyProfile={companyProfile} />

        {/* Invoice Title */}
        <div className="text-center my-8">
          <h1 className="text-3xl font-bold text-primary">TAX INVOICE</h1>
          <p className="text-sm text-gray-500 mt-1">Original for Recipient</p>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-lg mb-4">Bill To:</h3>
            <div className="space-y-1">
              <p className="font-medium">
                {invoice.customer?.companyName || `${invoice.customer?.firstName} ${invoice.customer?.lastName}`}
              </p>
              {invoice.customer?.billingAddress && (
                <>
                  <p>{invoice.customer.billingAddress.addressLine1}</p>
                  {invoice.customer.billingAddress.addressLine2 && (
                    <p>{invoice.customer.billingAddress.addressLine2}</p>
                  )}
                  <p>
                    {invoice.customer.billingAddress.city}, {invoice.customer.billingAddress.state}{" "}
                    {invoice.customer.billingAddress.postalCode}
                  </p>
                  <p>{invoice.customer.billingAddress.country}</p>
                </>
              )}
              {invoice.customer?.gstNumber && <p>GSTIN: {invoice.customer.gstNumber}</p>}

              {/* Contact Person */}
              {invoice.contactPerson && (
                <p className="mt-2">
                  <span className="font-medium">Contact Person: </span>
                  {invoice.contactPerson}
                </p>
              )}

              {/* Phone and Email */}
              {invoice.customer?.contacts && invoice.customer.contacts.length > 0 && (
                <>
                  {invoice.customer.contacts[0].phone && (
                    <p>
                      <span className="font-medium">Phone: </span>
                      {invoice.customer.contacts[0].phone}
                    </p>
                  )}
                  {invoice.customer.contacts[0].email && (
                    <p>
                      <span className="font-medium">Email: </span>
                      {invoice.customer.contacts[0].email}
                    </p>
                  )}
                </>
              )}
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
                <span>{formatDate(invoice.date)}</span>
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
              {invoice.placeOfSupply && (
                <div>
                  <span className="font-medium">Place of Supply: </span>
                  <span>{invoice.placeOfSupply}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Project Information */}
        {invoice.project && (
          <div className="mb-6 p-3 bg-gray-50 rounded-md">
            <p>
              <span className="font-medium">Project: </span>
              {invoice.project.name} {invoice.project.projectCode && `(${invoice.project.projectCode})`}
            </p>
          </div>
        )}

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left">S.No.</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Description of Goods/Services</th>
                <th className="border border-gray-300 px-4 py-2 text-center">HSN/SAC</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Qty</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Unit Price</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Tax %</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.description}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{item.hsn || item.sacCode || "-"}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(Number(item.unitPrice) || 0)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{item.taxRate || "-"}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
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
                    <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(invoice.subtotal)}</td>
                  </tr>

                  {invoice.discountAmount > 0 && (
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Discount</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        -{formatCurrency(invoice.discountAmount)}
                      </td>
                    </tr>
                  )}

                  {invoice.shippingAmount > 0 && (
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Shipping</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        {formatCurrency(invoice.shippingAmount)}
                      </td>
                    </tr>
                  )}

                  {invoice.adjustmentAmount !== 0 && (
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">{invoice.adjustmentLabel || "Adjustment"}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        {formatCurrency(invoice.adjustmentAmount)}
                      </td>
                    </tr>
                  )}

                  {invoice.cgst > 0 && (
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">CGST (9%)</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(invoice.cgst)}</td>
                    </tr>
                  )}

                  {invoice.sgst > 0 && (
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">SGST (9%)</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(invoice.sgst)}</td>
                    </tr>
                  )}

                  {invoice.igst > 0 && (
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">IGST (18%)</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(invoice.igst)}</td>
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

        {/* Bank Details */}
        <div className="border border-gray-300 p-4 rounded-md mb-8">
          <h3 className="font-semibold mb-2">Bank Details:</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p>
                <span className="font-medium">Bank Name:</span> {companyProfile?.bankName || "HDFC Bank"}
              </p>
              <p>
                <span className="font-medium">Account Name:</span> {companyProfile?.companyName || "GCS Services"}
              </p>
              <p>
                <span className="font-medium">Account Number:</span>{" "}
                {companyProfile?.bankAccountNumber || "50200012345678"}
              </p>
            </div>
            <div>
              <p>
                <span className="font-medium">Branch:</span> {companyProfile?.bankBranch || "Mumbai"}
              </p>
              <p>
                <span className="font-medium">IFSC Code:</span> {companyProfile?.bankIfscCode || "HDFC0001234"}
              </p>
              <p>
                <span className="font-medium">Account Type:</span> {companyProfile?.bankAccountType || "Current"}
              </p>
            </div>
          </div>
        </div>

        {/* Notes and Terms */}
        {(invoice.notes || invoice.termsAndConditions) && (
          <div className="space-y-4 mb-8">
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

        {/* Signature Section */}
        <div className="flex justify-between items-end mt-16 mb-8">
          <div>
            <p className="text-sm">Customer Signature</p>
            <div className="border-b border-gray-300 w-48 mt-8"></div>
          </div>

          <div className="text-right">
            <p className="text-sm">For {companyProfile?.companyName || "GCS Services"}</p>
            <div className="border-b border-gray-300 w-48 mt-8"></div>
            <p className="text-sm mt-2">Authorized Signatory</p>
          </div>
        </div>

        {/* Company Footer */}
        <CompanyFooter companyProfile={companyProfile} />
      </div>

      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
