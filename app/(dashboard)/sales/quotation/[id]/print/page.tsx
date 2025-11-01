"use client"

import { useState, useEffect } from "react"
import { notFound, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, Printer, Download } from "lucide-react"

export default function QuotationPrintPage() {
  const [quotation, setQuotation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const id = params.id as string

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const quotationRes = await fetch(`/api/sales/quotation/${id}`)
        if (!quotationRes.ok) {
          throw new Error("Failed to fetch quotation")
        }
        const quotationData = await quotationRes.json()
        setQuotation(quotationData)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load quotation data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchData()
    }
  }, [id])

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/sales/quotation/${id}/pdf`)
      if (!response.ok) throw new Error("Failed to generate PDF")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `quotation-${quotation.quotationNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading PDF:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <p>Loading quotation data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="rounded-md bg-red-50 p-4">
          <h2 className="text-lg font-medium text-red-800">Error</h2>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <Button className="mt-4" variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!quotation) {
    notFound()
  }

  const customerName =
    quotation.customer?.companyName ||
    `${quotation.customer?.firstName || ""} ${quotation.customer?.lastName || ""}`.trim()

  return (
    <div className="container mx-auto p-4 print:p-0">
      <div className="mb-4 flex justify-between print:hidden">
        <h1 className="text-2xl font-bold">Quotation Print Preview</h1>
        <div className="flex gap-2">
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Print Content */}
      <div className="bg-white p-8 print:p-0 font-mono text-sm">
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-xl font-bold">GLOBAL CONSULTANCY SERVICES</h1>
          <h2 className="text-lg">MARINE & OFFSHORE</h2>
          <div className="mt-2 text-xs">
            <p>016, Loha Bhavan 93, Loha Bhavan, P D'Mello Road, Carnac Bunder,</p>
            <p>Masjid (East), Mumbai, Maharashtra, India. Pincode - 400 009</p>
            <p>Email: admin@globalconsultancyservices.net | Tel: +919869990250</p>
            <p>MSME Reg. No.: UDYAM-MH-19-0015824</p>
            <p>ISO 9001:2015 Certified by IRQS</p>
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-lg font-bold">QUOTATION</h2>
          <p className="text-sm">"ORIGINAL FOR RECIPIENT"</p>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-6 border border-black p-4">
          <div>
            <h3 className="font-bold mb-2">Client:</h3>
            <p className="font-bold">{customerName}</p>
            {quotation.customer?.billingAddress && (
              <div className="text-xs mt-1">
                <p>{quotation.customer.billingAddress.addressLine1}</p>
                {quotation.customer.billingAddress.addressLine2 && (
                  <p>{quotation.customer.billingAddress.addressLine2}</p>
                )}
                <p>
                  {quotation.customer.billingAddress.city}, {quotation.customer.billingAddress.state}{" "}
                  {quotation.customer.billingAddress.postalCode}
                </p>
                <p>{quotation.customer.billingAddress.country}</p>
              </div>
            )}
            {quotation.customer?.gstNumber && <p className="text-xs mt-1">GST No: {quotation.customer.gstNumber}</p>}
          </div>
          <div>
            <p>
              <span className="font-bold">Quotation No.:</span> {quotation.quotationNumber}
            </p>
            <p>
              <span className="font-bold">Date:</span> {new Date(quotation.date).toLocaleDateString("en-IN")}
            </p>
            <p>
              <span className="font-bold">Valid Until:</span>{" "}
              {new Date(quotation.validUntil).toLocaleDateString("en-IN")}
            </p>
            {quotation.placeOfSupply && (
              <p>
                <span className="font-bold">Place of Supply:</span> {quotation.placeOfSupply}
              </p>
            )}
          </div>
        </div>

        <div className="mb-4">
          <p>
            <span className="font-bold">Subject:</span> Quotation for {customerName}
          </p>
        </div>

        <table className="w-full border-collapse border border-black mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 text-center">Sr. No.</th>
              <th className="border border-black p-2">Description</th>
              <th className="border border-black p-2 text-center">Qty</th>
              <th className="border border-black p-2 text-center">Unit Price (₹)</th>
              <th className="border border-black p-2 text-center">Tax (%)</th>
              <th className="border border-black p-2 text-center">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {quotation.items?.map((item: any, index: number) => (
              <tr key={item.id}>
                <td className="border border-black p-2 text-center">{index + 1}</td>
                <td className="border border-black p-2">{item.description}</td>
                <td className="border border-black p-2 text-center">{item.quantity}</td>
                <td className="border border-black p-2 text-center">
                  {Number.parseFloat(item.unitPrice || 0).toFixed(2)}
                </td>
                <td className="border border-black p-2 text-center">{Number.parseFloat(item.tax || 0)}%</td>
                <td className="border border-black p-2 text-right">{Number.parseFloat(item.total || 0).toFixed(2)}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 5 - (quotation.items?.length || 0)) }).map((_, index) => (
              <tr key={`empty-${index}`}>
                <td className="border border-black p-2 h-8"></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-6">
          <div className="w-64 border border-black p-4">
            <div className="flex justify-between mb-2">
              <span>Subtotal:</span>
              <span>₹{Number.parseFloat(quotation.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Tax:</span>
              <span>₹{Number.parseFloat(quotation.tax || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2">
              <span>Grand Total:</span>
              <span>₹{Number.parseFloat(quotation.total || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {quotation.termsAndConditions && (
          <div className="mb-6">
            <h3 className="font-bold mb-2">Terms and Conditions:</h3>
            <div className="whitespace-pre-wrap text-xs">{quotation.termsAndConditions}</div>
          </div>
        )}

        <div className="border-t-2 border-black pt-4 mt-8">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold mb-2">Company Details:</h3>
              <p className="text-xs">GST No.: 27AINPA9487A1Z4</p>
              <p className="text-xs">PAN No.: AINPA9487A</p>
              <p className="text-xs">HSN/SAC: 998391</p>
              <p className="text-xs">Bank: ICICI BANK LTD.</p>
              <p className="text-xs">Branch & IFSC: VIKHROLI (EAST) & ICIC0001249</p>
              <p className="text-xs">Account No.: 124905500046</p>
            </div>
            <div className="text-right">
              <p className="font-bold">For, GLOBAL CONSULTANCY SERVICES</p>
              <div className="mt-16">
                <p className="font-bold">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
