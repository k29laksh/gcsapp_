"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil, ArrowUpRight, ArrowLeft, FileText, Calendar, User, DollarSign, Clock } from "lucide-react"
import { useGetSingleInquiryQuery } from "@/redux/Service/inquiry"

export default function InquiryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  // RTK Query hook
  const { data: inquiry, isLoading, error } = useGetSingleInquiryQuery(id)

  const getStatusBadge = (status: string) => {
    const statusColors = {
      "Pending": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
      "Completed": "bg-green-100 text-green-800 border-green-200",
      "Cancelled": "bg-red-100 text-red-800 border-red-200",
    }
    return (
      <Badge variant="outline" className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    )
  }

  const getSourceBadge = (source: string) => {
    const sourceColors = {
      "Email": "bg-blue-100 text-blue-800",
      "Phone": "bg-green-100 text-green-800",
      "Website": "bg-purple-100 text-purple-800",
      "Referral": "bg-orange-100 text-orange-800",
    }
    return (
      <Badge className={sourceColors[source as keyof typeof sourceColors] || "bg-gray-100 text-gray-800"}>
        {source}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/sales/inquiry")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">Loading Inquiry...</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2 h-64 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !inquiry) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/sales/inquiry")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">Inquiry Not Found</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">The inquiry you are looking for does not exist.</p>
              <Button className="mt-4" onClick={() => router.push("/sales/inquiry")}>
                Back to Inquiries
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/sales/inquiry")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">Inquiry Details</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/sales/inquiry/${id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button onClick={() => router.push(`/sales/quotation/new?inquiryId=${id}`)}>
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Convert to Quotation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {inquiry.subject}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Created on {formatDate(inquiry.date)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-3 font-semibold text-lg flex items-center gap-2">
                Requirements
              </h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap text-sm">
                  {inquiry.requirements || "No detailed requirements provided."}
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-lg flex items-center gap-2">
                Additional Notes
              </h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap text-sm">{inquiry.notes || "No additional notes."}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inquiry.budget && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Budget</p>
                    <p className="text-lg font-bold text-blue-700">{formatCurrency(inquiry.budget)}</p>
                  </div>
                </div>
              )}

              {inquiry.timeline && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Clock className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">Timeline</p>
                    <p className="text-lg font-bold text-green-700">{inquiry.timeline}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Status</span>
                {getStatusBadge(inquiry.status)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Assignment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Assigned To</span>
                <p className="text-sm mt-1">
                  {inquiry.assigned_to ? `User ID: ${inquiry.assigned_to}` : "Unassigned"}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Source</span>
                <div className="mt-1">
                  {getSourceBadge(inquiry.source)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Inquiry Date</span>
                <p className="text-sm mt-1">{formatDate(inquiry.date)}</p>
              </div>
              {inquiry.follow_up_date && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Follow-up Date</span>
                  <p className="text-sm mt-1">{formatDate(inquiry.follow_up_date)}</p>
                </div>
              )}
              {inquiry.timeline && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Expected Completion</span>
                  <p className="text-sm mt-1">{inquiry.timeline}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/sales/inquiry/${id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Inquiry
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/sales/quotation/new?inquiryId=${id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Create Quotation
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push("/sales/inquiry")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to List
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}