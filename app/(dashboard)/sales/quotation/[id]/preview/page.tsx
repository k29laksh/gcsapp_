"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { QuotationPrintTemplate } from "@/components/quotation-print-template"

export default function QuotationPreviewPage() {
  const params = useParams()
  const [quotation, setQuotation] = useState<any>(null)
  const [companyProfile, setCompanyProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const id = params.id as string

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch quotation
        const quotationRes = await fetch(`/api/sales/quotation/${id}`)
        if (quotationRes.ok) {
          const quotationData = await quotationRes.json()
          setQuotation(quotationData)
        }

        // Fetch company profile
        const companyRes = await fetch("/api/settings/company-profile")
        if (companyRes.ok) {
          const companyData = await companyRes.json()
          setCompanyProfile(companyData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading preview...</p>
        </div>
      </div>
    )
  }

  if (!quotation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Quotation not found</h2>
          <p className="mt-2 text-gray-600">The quotation you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto bg-white shadow-lg">
        <QuotationPrintTemplate quotation={quotation} companyProfile={companyProfile} />
      </div>
    </div>
  )
}
