"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { Loader2, ArrowLeft, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useGetSinglePayrollQuery, useDownloadPayslipMutation } from "@/redux/Service/payroll"
import Link from "next/link"

export default function PayrollDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const payrollId = params.id as string

  const { data: payroll, isLoading, error } = useGetSinglePayrollQuery(payrollId)
  const [downloadPayslip, { isLoading: isDownloading }] = useDownloadPayslipMutation()

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

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Loading payroll details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !payroll) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            {error ? "Failed to load payroll details." : "Payroll not found."}
          </p>
          <Button onClick={() => router.push("/hr/payroll")}>Back to Payroll</Button>
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
    <div className="container mx-auto py-6">
      {/* Top bar with back and preview */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/hr/payroll">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Payslip Details</h1>
        </div>

        {/* ✅ Preview Payslip button */}
        <Button
          variant="secondary"
          onClick={() => router.push(`/hr/payroll/${payrollId}/payslip`)}
          className="flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          Preview Payslip
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Payslip for {format(new Date(payroll.pay_month + "-01"), "MMMM yyyy")}
              </CardTitle>
              <CardDescription>
                {payroll.date && `Date: ${format(new Date(payroll.date), "PPP")}`}
                {payroll.payment_date && ` | Payment Date: ${format(new Date(payroll.payment_date), "PPP")}`}
                {!payroll.date && !payroll.payment_date && "Pending"}
              </CardDescription>
            </div>
            <Badge
              className={
                payroll.status === "paid"
                  ? "bg-green-100 text-green-800 border-green-300"
                  : "bg-yellow-100 text-yellow-800 border-yellow-300"
              }
            >
              {payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {/* Employee & Payroll Info */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold mb-2">Employee Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">
                    {payroll.employee.firstName} {payroll.employee.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Designation:</span>
                  <span className="font-medium">{payroll.employee.position}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employee ID:</span>
                  <span className="font-medium">{payroll.employee.employeeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{payroll.employee.email}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Payroll Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pay Month:</span>
                  <span className="font-medium">
                    {format(new Date(payroll.pay_month + "-01"), "MMMM yyyy")}
                  </span>
                </div>
                {payroll.transaction_id && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction ID:</span>
                    <span className="font-medium">{payroll.transaction_id}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Salary breakdown */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold mb-4">Earnings Breakdown</h3>
              <div className="space-y-3">
                {breakdown.earnings.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-muted-foreground">{item.title}</span>
                    <span className="font-medium">
                      ₹{item.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Deductions Breakdown</h3>
              <div className="space-y-3">
                {breakdown.deductions.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-muted-foreground">{item.title}</span>
                    <span className="font-medium">
                      ₹{item.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Net Salary */}
          <div className="flex justify-between items-center bg-primary/10 p-4 rounded-lg">
            <span className="text-xl font-bold">Net Salary:</span>
            <span className="text-2xl font-bold text-primary">
              ₹{payroll.net_salary.toLocaleString("en-IN")}
            </span>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between text-sm text-muted-foreground no-print">
          <div>Payslip ID: {payroll.id}</div>
          <div>Generated on: {format(new Date(), "PPP 'at' hh:mm a")}</div>
        </CardFooter>
      </Card>
    </div>
  )
}
