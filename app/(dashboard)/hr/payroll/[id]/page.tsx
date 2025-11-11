"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { Loader2, ArrowLeft, Eye, Download, User, Calendar, DollarSign, FileText, CheckCircle, Clock, Ban, Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  useGetSinglePayrollQuery, 
  useDownloadPayslipMutation,
  useUpdatePayrollMutation,
  useDeletePayrollMutation 
} from "@/redux/Service/payroll"
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
} from "@/components/ui/alert-dialog"

export default function PayrollDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const payrollId = params.id as string

  const { data: payroll, isLoading, error } = useGetSinglePayrollQuery(payrollId)
  const [downloadPayslip, { isLoading: isDownloading }] = useDownloadPayslipMutation()
  const [updatePayroll, { isLoading: isUpdating }] = useUpdatePayrollMutation()
  const [deletePayroll, { isLoading: isDeleting }] = useDeletePayrollMutation()

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load payroll details",
        variant: "destructive",
      })
    }
  }, [error, toast])

  const handleGeneratePDF = async () => {
    if (!payroll) return

    setIsGeneratingPDF(true)
    try {
      const blob = await downloadPayslip(payrollId).unwrap()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `payslip-${payroll.employee.employeeId}-${payroll.pay_month}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "Payslip generated and downloaded successfully",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to generate payslip",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleMarkAsPaid = async () => {
    if (!payroll) return

    try {
      await updatePayroll({
        id: payrollId,
        data: { 
          status: "paid",
          payment_date: new Date().toISOString().split('T')[0] // Set today's date as payment date
        }
      }).unwrap()

      toast({
        title: "Success",
        description: "Payroll marked as paid successfully",
      })
    } catch (error) {
      console.error("Error updating payroll:", error)
      toast({
        title: "Error",
        description: "Failed to update payroll status",
        variant: "destructive",
      })
    }
  }

  const handleDeletePayroll = async () => {
    try {
      await deletePayroll(payrollId).unwrap()

      toast({
        title: "Success",
        description: "Payroll deleted successfully",
      })

      router.push("/hr/payroll")
    } catch (error) {
      console.error("Error deleting payroll:", error)
      toast({
        title: "Error",
        description: "Failed to delete payroll",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    const statusColors = {
      paid: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      draft: "bg-gray-100 text-gray-800 border-gray-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    }
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "draft":
        return <FileText className="h-4 w-4" />
      case "cancelled":
        return <Ban className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Button variant="outline" onClick={() => router.push("/hr/payroll")} className="mb-4 sm:mb-6">
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

  if (error || !payroll) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Button variant="outline" onClick={() => router.push("/hr/payroll")} className="mb-4 sm:mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="mt-8 text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-red-600">
              {error ? "Failed to load payroll details." : "Payroll not found."}
            </h1>
          </div>
        </div>
      </div>
    )
  }

  const defaultBreakdown = {
    earnings: [
      { title: "Basic Salary", amount: payroll.basic_salary },
      { title: "Allowances", amount: payroll.allowances },
    ],
    deductions: [{ title: "Deductions", amount: payroll.deductions }],
  }

  const breakdown = payroll.breakdown || defaultBreakdown

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Button variant="outline" onClick={() => router.push("/hr/payroll")} className="w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Payroll
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={() => router.push(`/hr/payroll/${payrollId}/payslip`)}
              className="flex-1 sm:flex-none"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview Payslip
            </Button>
            <Button
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
              className="flex-1 sm:flex-none"
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download PDF
            </Button>
          </div>
        </div>

        {/* Main Header */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl sm:text-2xl md:text-3xl truncate flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  Payslip #{payroll.id.slice(-8)}
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Pay Month: {format(new Date(payroll.pay_month + "-01"), "MMMM yyyy")}
                </CardDescription>
              </div>
              <Badge className={`${getStatusColor(payroll.status)} text-sm sm:text-base px-3 py-1 whitespace-nowrap flex items-center gap-1.5`}>
                {getStatusIcon(payroll.status)}
                {payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Payroll Details */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Payroll Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Pay Month</p>
                <p className="font-semibold text-sm sm:text-base">
                  {format(new Date(payroll.pay_month + "-01"), "MMMM yyyy")}
                </p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Payment Date</p>
                <p className="font-semibold text-sm sm:text-base">
                  {payroll.payment_date ? formatDate(payroll.payment_date) : "Pending"}
                </p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Net Salary</p>
                <p className="font-semibold text-sm sm:text-base">{formatCurrency(payroll.net_salary)}</p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Employee</p>
                <p className="font-semibold text-sm sm:text-base truncate">
                  {payroll.employee.firstName} {payroll.employee.lastName}
                </p>
              </div>
              {payroll.transaction_id && (
                <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                  <p className="text-xs sm:text-sm text-gray-600">Transaction ID</p>
                  <p className="font-semibold text-sm sm:text-base">{payroll.transaction_id}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Employee & Company Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <User className="h-4 w-4 text-gray-600" />
                Employee Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Full Name</p>
                <p className="font-semibold text-sm sm:text-base">
                  {payroll.employee.firstName} {payroll.employee.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Employee ID</p>
                <p className="font-semibold text-sm sm:text-base">{payroll.employee.employeeId}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Designation</p>
                <p className="font-semibold text-sm sm:text-base">{payroll.employee.position}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Email</p>
                <p className="font-semibold text-sm sm:text-base break-words">{payroll.employee.email}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-sm sm:text-base">Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Company</p>
                <p className="font-semibold text-sm sm:text-base">GCS Services</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Address</p>
                <p className="font-semibold text-sm sm:text-base break-words">
                  123 Business Park, Suite 456<br />
                  Mumbai, Maharashtra 400001<br />
                  India
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">GSTIN</p>
                <p className="font-semibold text-sm sm:text-base">27AABCG1234A1Z5</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Salary Breakdown */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Salary Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-4">
            {/* Mobile View - Cards */}
            <div className="block sm:hidden space-y-3 p-3">
              {/* Earnings */}
              <div className="border rounded-lg p-3 space-y-2 bg-green-50">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-sm text-green-800">Earnings</span>
                </div>
                {breakdown.earnings.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.title}</span>
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>

              {/* Deductions */}
              <div className="border rounded-lg p-3 space-y-2 bg-red-50">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-sm text-red-800">Deductions</span>
                </div>
                {breakdown.deductions.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.title}</span>
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop View - Table */}
            <div className="hidden sm:block overflow-x-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                {/* Earnings */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-green-800">Earnings</h3>
                  <div className="space-y-3">
                    {breakdown.earnings.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">{item.title}</span>
                        <span className="font-medium">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-red-800">Deductions</h3>
                  <div className="space-y-3">
                    {breakdown.deductions.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">{item.title}</span>
                        <span className="font-medium">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Salary Summary */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Salary Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Basic Salary:</span>
                  <span className="font-medium">{formatCurrency(payroll.basic_salary)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Allowances:</span>
                  <span className="font-medium">{formatCurrency(payroll.allowances)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Deductions:</span>
                  <span className="font-medium text-red-600">-{formatCurrency(payroll.deductions)}</span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between font-medium text-base">
                    <span>Net Salary:</span>
                    <span className="text-green-600">{formatCurrency(payroll.net_salary)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/hr/payroll/${payrollId}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Payroll
              </Button>

              <Button
                className="w-full justify-start"
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
              >
                {isGeneratingPDF ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download PDF
              </Button>

              {payroll.status === "pending" && (
                <Button 
                  className="w-full justify-start bg-green-600 hover:bg-green-700"
                  onClick={handleMarkAsPaid}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Mark as Paid
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start text-white"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete Payroll
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the payroll record
                      and remove it from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeletePayroll}
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-800 font-medium text-sm">Payslip Details</span>
                </div>
                <p className="text-xs text-blue-700">
                  Payslip ID: {payroll.id}
                </p>
                <p className="text-xs text-blue-700">
                  Generated on: {format(new Date(), "PPP 'at' hh:mm a")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}