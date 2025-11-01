"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Image from "next/image"

interface QuotationPrintTemplateProps {
  quotation: any
  companyProfile: any
  headerImageUrl?: string
  footerImageUrl?: string
}

export function QuotationPrintTemplate({
  quotation,
  companyProfile,
  headerImageUrl,
  footerImageUrl,
}: QuotationPrintTemplateProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null // Prevent SSR rendering issues with window object
  }

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // Function to convert number to words (for Indian currency)
  const numberToWords = (num: number) => {
    const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ]
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    function convertLessThanOneThousand(n: number): string {
      if (n === 0) return ""
      if (n < 10) return units[n]
      if (n < 20) return teens[n - 10]
      if (n < 100) {
        return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + units[n % 10] : "")
      }
      return (
        units[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + convertLessThanOneThousand(n % 100) : "")
      )
    }

    if (num === 0) return "Zero Rupees Only"

    const rupees = Math.floor(num)
    const paise = Math.round((num - rupees) * 100)

    let result = ""

    if (rupees > 0) {
      if (rupees < 1000) {
        result = convertLessThanOneThousand(rupees)
      } else if (rupees < 100000) {
        result = convertLessThanOneThousand(Math.floor(rupees / 1000)) + " Thousand"
        if (rupees % 1000 !== 0) {
          result += " " + convertLessThanOneThousand(rupees % 1000)
        }
      } else if (rupees < 10000000) {
        result = convertLessThanOneThousand(Math.floor(rupees / 100000)) + " Lakh"
        if (rupees % 100000 !== 0) {
          result += " " + numberToWords(rupees % 100000)
        }
      } else {
        result = convertLessThanOneThousand(Math.floor(rupees / 10000000)) + " Crore"
        if (rupees % 10000000 !== 0) {
          result += " " + numberToWords(rupees % 10000000)
        }
      }

      result += " Rupees"
    }

    if (paise > 0) {
      result += (rupees > 0 ? " and " : "") + convertLessThanOneThousand(paise) + " Paise"
    }

    return result + " Only"
  }

  return (
    <div className="quotation-print-template bg-white p-6 print:p-0">
      {/* Header Image */}
      {headerImageUrl && (
        <div className="mb-4 flex justify-center">
          <Image
            src={headerImageUrl || "/placeholder.svg"}
            alt="Company Header"
            width={800}
            height={150}
            className="h-auto max-w-full"
            priority
          />
        </div>
      )}

      {/* Quotation Title */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">QUOTATION</h1>
        <p className="text-sm text-gray-600">Original for Recipient</p>
      </div>

      {/* Quotation Info and Customer Info */}
      <div className="mb-6 grid grid-cols-2 gap-4 border border-gray-300 p-4">
        <div>
          <h2 className="mb-2 font-semibold">Client:</h2>
          <p className="text-sm">
            {quotation.customer?.companyName || `${quotation.customer?.firstName} ${quotation.customer?.lastName}`}
          </p>
          {quotation.customer?.gstNumber && (
            <p className="text-sm">
              <span className="font-medium">GST No:</span> {quotation.customer.gstNumber}
            </p>
          )}
          {quotation.customer?.billingAddress && (
            <p className="text-sm">
              {quotation.customer.billingAddress.addressLine1}
              {quotation.customer.billingAddress.addressLine2 && (
                <>
                  <br />
                  {quotation.customer.billingAddress.addressLine2}
                </>
              )}
              <br />
              {quotation.customer.billingAddress.city}, {quotation.customer.billingAddress.state}{" "}
              {quotation.customer.billingAddress.postalCode}
              <br />
              {quotation.customer.billingAddress.country}
            </p>
          )}
        </div>
        <div>
          <p className="text-sm">
            <span className="font-medium">Quotation No:</span> {quotation.quotationNumber}
          </p>
          <p className="text-sm">
            <span className="font-medium">Date:</span> {formatDate(quotation.date)}
          </p>
          <p className="text-sm">
            <span className="font-medium">Valid Until:</span> {formatDate(quotation.validUntil)}
          </p>
          {quotation.project && (
            <p className="text-sm">
              <span className="font-medium">Project:</span> {quotation.project.name} ({quotation.project.projectCode})
            </p>
          )}
        </div>
      </div>

      {/* Subject Line */}
      <div className="mb-4">
        <p className="font-medium">
          <span className="font-semibold">Subject:</span> Quotation for{" "}
          {quotation.customer?.companyName || `${quotation.customer?.firstName} ${quotation.customer?.lastName}`}
        </p>
      </div>

      {/* Items Table */}
      <div className="mb-6 overflow-hidden rounded-md border border-gray-300">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="w-16 text-center">Sr. No.</TableHead>
              <TableHead className="w-[40%]">Description</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead className="text-center">Unit Price (₹)</TableHead>
              <TableHead className="text-center">Tax (%)</TableHead>
              <TableHead className="text-right">Amount (₹)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotation.items.map((item: any, index: number) => (
              <TableRow key={item.id}>
                <TableCell className="text-center">{index + 1}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell className="text-center">{item.quantity}</TableCell>
                <TableCell className="text-center">{formatCurrency(item.unitPrice).replace("₹", "")}</TableCell>
                <TableCell className="text-center">{item.tax}%</TableCell>
                <TableCell className="text-right">{formatCurrency(item.total).replace("₹", "")}</TableCell>
              </TableRow>
            ))}
            {/* Empty rows to maintain consistent table size */}
            {Array.from({ length: Math.max(0, 10 - quotation.items.length) }).map((_, index) => (
              <TableRow key={`empty-${index}`}>
                <TableCell className="h-10"></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Totals */}
      <div className="mb-6 grid grid-cols-2">
        <div></div>
        <div className="space-y-2 border border-gray-300 p-4">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(quotation.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>{formatCurrency(quotation.tax)}</span>
          </div>
          {quotation.discountAmount > 0 && (
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>-{formatCurrency(quotation.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-300 pt-2 font-bold">
            <span>Grand Total:</span>
            <span>{formatCurrency(quotation.total)}</span>
          </div>
        </div>
      </div>

      {/* Amount in Words */}
      <div className="mb-6">
        <p className="text-sm">
          <span className="font-semibold">Amount in Words:</span> {numberToWords(quotation.total)}
        </p>
      </div>

      {/* Terms and Conditions */}
      {quotation.termsAndConditions && (
        <div className="mb-6">
          <h3 className="mb-2 font-semibold">Terms and Conditions:</h3>
          <div className="whitespace-pre-wrap text-sm">{quotation.termsAndConditions}</div>
        </div>
      )}

      {/* Notes */}
      {quotation.notes && (
        <div className="mb-6">
          <h3 className="mb-2 font-semibold">Notes:</h3>
          <div className="whitespace-pre-wrap text-sm">{quotation.notes}</div>
        </div>
      )}

      {/* Footer Image */}
      {footerImageUrl && (
        <div className="mt-4 flex justify-center">
          <Image
            src={footerImageUrl || "/placeholder.svg"}
            alt="Company Footer"
            width={800}
            height={100}
            className="h-auto max-w-full"
          />
        </div>
      )}

      {/* Print-only styles */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .quotation-print-template {
            width: 100%;
            max-width: 100%;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  )
}
