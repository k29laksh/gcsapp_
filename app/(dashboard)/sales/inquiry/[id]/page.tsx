"use client"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, FileText, Calendar, User, DollarSign, Clock, Mail, Phone, Globe, Users, IndianRupee, Trash, Loader2 } from "lucide-react"
import { useDeleteInquiryMutation, useGetSingleInquiryQuery } from "@/redux/Service/inquiry"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export default function InquiryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Fetch inquiry data

  const { data: inquiry, isLoading, error } = useGetSingleInquiryQuery(id)
    const [deleteInquiry] = useDeleteInquiryMutation();

 const handleDeleteInquiry = async () => {
    try {
      setIsDeleting(true);
      await deleteInquiry(id).unwrap();

      toast({
        title: "Success",
        description: "Inquiry deleted successfully",
      });

      router.push("/sales/inquiry");
      router.refresh();
    } catch (error) {
      console.error("Error deleting inquiry:", error);
      toast({
        title: "Error",
        description: "Failed to delete invoice. Please try again.",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };
  const getStatusColor = (status: string) => {
    const statusColors = {
      "Pending": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
      "Completed": "bg-green-100 text-green-800 border-green-200",
      "Cancelled": "bg-red-100 text-red-800 border-red-200",
    }
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
  }

  const getSourceIcon = (source: string) => {
    const sourceIcons = {
      "Email": Mail,
      "Phone": Phone,
      "Website": Globe,
      "Referral": Users,
    }
    return sourceIcons[source as keyof typeof sourceIcons] || Globe
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
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Button variant="outline" onClick={() => router.push("/sales/inquiry")} className="mb-4 sm:mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
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
      </div>
    )
  }

  if (error || !inquiry) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Button variant="outline" onClick={() => router.push("/sales/inquiry")} className="mb-4 sm:mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="mt-8 text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-red-600">Inquiry Not Found</h1>
          </div>
        </div>
      </div>
    )
  }

  const SourceIcon = getSourceIcon(inquiry.source)

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Button variant="outline" onClick={() => router.push("/sales/inquiry")} className="w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              size="sm" 
              onClick={() => router.push(`/sales/inquiry/${inquiry.id}/edit`)} 
              className="flex-1 sm:flex-none"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="flex-1 sm:flex-none text-white">
                              <Trash className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the invoice and remove it from our servers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDeleteInquiry}
                                disabled={isDeleting}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {isDeleting ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
          </div>
        </div>

        {/* Main Header */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl sm:text-2xl md:text-3xl truncate flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  {inquiry.subject}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Created on {formatDate(inquiry.date)}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <Badge variant="outline" className={`${getStatusColor(inquiry.status)} text-sm sm:text-base px-3 py-1 whitespace-nowrap`}>
                  {inquiry.status}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1 text-sm sm:text-base whitespace-nowrap">
                  <SourceIcon className="h-3.5 w-3.5" />
                  {inquiry.source}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Inquiry Details */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Inquiry Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Inquiry Date</p>
                <p className="font-semibold text-sm sm:text-base">{formatDate(inquiry.date)}</p>
              </div>
              {inquiry.follow_up_date && (
                <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                  <p className="text-xs sm:text-sm text-gray-600">Follow-up Date</p>
                  <p className="font-semibold text-sm sm:text-base">{formatDate(inquiry.follow_up_date)}</p>
                </div>
              )}
              {inquiry.budget && (
                <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                  <p className="text-xs sm:text-sm text-gray-600">Budget</p>
                  <p className="font-semibold text-sm sm:text-base">{formatCurrency(inquiry.budget)}</p>
                </div>
              )}
              {inquiry.timeline && (
                <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                  <p className="text-xs sm:text-sm text-gray-600">Timeline</p>
                  <p className="font-semibold text-sm sm:text-base">{inquiry.timeline}</p>
                </div>
              )}
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Assigned To</p>
                <p className="font-semibold text-sm sm:text-base">
                  {inquiry.assigned_to ? `User ID: ${inquiry.assigned_to}` : "Unassigned"}
                </p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Source</p>
                <p className="font-semibold text-sm sm:text-base flex items-center gap-1">
                  <SourceIcon className="h-3.5 w-3.5" />
                  {inquiry.source}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requirements & Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-sm sm:text-base">Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-3 sm:p-4 rounded border min-h-[120px]">
                <p className="whitespace-pre-wrap text-gray-700 leading-relaxed text-sm">
                  {inquiry.requirements || "No detailed requirements provided."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-sm sm:text-base">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-3 sm:p-4 rounded border min-h-[120px]">
                <p className="whitespace-pre-wrap text-gray-700 leading-relaxed text-sm">
                  {inquiry.notes || "No additional notes."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget & Timeline Highlights */}
        {(inquiry.budget || inquiry.timeline) && (
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Key Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {inquiry.budget && (
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="p-3 bg-blue-100 rounded-full shrink-0">
                      <IndianRupee className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Budget</p>
                      <p className="text-lg font-bold text-blue-700">{formatCurrency(inquiry.budget)}</p>
                    </div>
                  </div>
                )}

                {inquiry.timeline && (
                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="p-3 bg-green-100 rounded-full shrink-0">
                      <Clock className="h-5 w-5 text-green-600" />
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
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                onClick={() => router.push(`/sales/inquiry/${id}/edit`)}
                className="flex items-center justify-center gap-2 h-12"
              >
                <Edit className="w-4 h-4" />
                Edit Inquiry
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push(`/sales/quotation/new?inquiryId=${id}`)}
                className="flex items-center justify-center gap-2 h-12"
              >
                <FileText className="w-4 h-4" />
                Create Quotation
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push("/sales/inquiry")}
                className="flex items-center justify-center gap-2 h-12"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to List
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}