"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Loader2,
  Edit,
  Printer,
  Send,
  Download,
  Trash,
  CheckCircle,
  Clock,
  AlertCircle,
  Ban,
  FileText,
  User,
  Calendar,
  DollarSign,
  MapPin,
} from "lucide-react";
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
import {
  useGetSingleInvoiceQuery,
  useDeleteInvoiceMutation,
  useSendInvoiceMutation,
  useLazyDownloadInvoicePdfQuery,
} from "@/redux/Service/invoice";
import InvoiceViewer from "@/components/InvoslipViewer";

export default function InvoiceDetailsPage() {
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const invoiceId = params.id as string;
  const userinfo = window.localStorage.getItem("userInfo");
  const token = userinfo ? JSON.parse(userinfo).access : null;

  // RTK Query hooks
  const {
    data: invoice,
    isLoading,
    error,
  } = useGetSingleInvoiceQuery(invoiceId);
  const [deleteInvoice] = useDeleteInvoiceMutation();
  const [sendInvoice] = useSendInvoiceMutation();
  const [downloadInvoicePdf] = useLazyDownloadInvoicePdfQuery();

  useEffect(() => {
    if (error) {
      console.error("Error fetching invoice:", error);
      toast({
        title: "Error",
        description: "Failed to load invoice data. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleDeleteInvoice = async () => {
    try {
      setIsDeleting(true);
      await deleteInvoice(invoiceId).unwrap();

      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });

      router.push("/sales/invoice");
      router.refresh();
    } catch (error) {
      console.error("Error deleting invoice:", error);
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
      Draft: "bg-gray-100 text-gray-800 border-gray-200",
      Sent: "bg-blue-100 text-blue-800 border-blue-200",
      Paid: "bg-green-100 text-green-800 border-green-200",
      Overdue: "bg-red-100 text-red-800 border-red-200",
      Cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Draft":
        return <FileText className="h-4 w-4" />;
      case "Sent":
        return <Send className="h-4 w-4" />;
      case "Paid":
        return <CheckCircle className="h-4 w-4" />;
      case "Overdue":
        return <AlertCircle className="h-4 w-4" />;
      case "Cancelled":
        return <Ban className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(numAmount);
  };

  const calculateSubtotal = () => {
    if (!invoice?.items) return 0;
    return invoice.items.reduce((sum: number, item: any) => {
      return sum + (parseFloat(item.amount) || 0);
    }, 0);
  };

  const calculateTotalTax = () => {
    if (!invoice) return 0;
    return (
      (parseFloat(invoice.cgst) || 0) +
      (parseFloat(invoice.sgst) || 0) +
      (parseFloat(invoice.igst) || 0)
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Button variant="outline" onClick={() => router.push("/sales/invoice")} className="mb-4 sm:mb-6">
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
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Button variant="outline" onClick={() => router.push("/sales/invoice")} className="mb-4 sm:mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="mt-8 text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-red-600">Invoice Not Found</h1>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = calculateSubtotal();
  const totalTax = calculateTotalTax();
  const totalAmount = parseFloat(invoice.total_amount);

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Button variant="outline" onClick={() => router.push("/sales/invoice")} className="w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.print()} 
              className="flex-1 sm:flex-none"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button 
              size="sm" 
              onClick={() => router.push(`/sales/invoice/${invoiceId}/edit`)} 
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
                    onClick={handleDeleteInvoice}
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
                  Invoice #{invoice.invoice_no}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Created on {formatDate(invoice.invoice_date)}
                </p>
              </div>
              <Badge className={`${getStatusColor(invoice.status)} text-sm sm:text-base px-3 py-1 whitespace-nowrap flex items-center gap-1.5`}>
                {getStatusIcon(invoice.status)}
                {invoice.status}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Invoice Details */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Invoice Date</p>
                <p className="font-semibold text-sm sm:text-base">{formatDate(invoice.invoice_date)}</p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Due Date</p>
                <p className="font-semibold text-sm sm:text-base">{formatDate(invoice.due_date)}</p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Total Amount</p>
                <p className="font-semibold text-sm sm:text-base">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Customer</p>
                <p className="font-semibold text-sm sm:text-base truncate">{invoice.customer}</p>
              </div>
              {invoice.po_no && (
                <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                  <p className="text-xs sm:text-sm text-gray-600">PO Number</p>
                  <p className="font-semibold text-sm sm:text-base">{invoice.po_no}</p>
                </div>
              )}
              {invoice.our_ref && (
                <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                  <p className="text-xs sm:text-sm text-gray-600">Our Reference</p>
                  <p className="font-semibold text-sm sm:text-base">{invoice.our_ref}</p>
                </div>
              )}
              {invoice.place_of_supply && (
                <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                  <p className="text-xs sm:text-sm text-gray-600">Place of Supply</p>
                  <p className="font-semibold text-sm sm:text-base">{invoice.place_of_supply}</p>
                </div>
              )}
              {invoice.project && (
                <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                  <p className="text-xs sm:text-sm text-gray-600">Project</p>
                  <p className="font-semibold text-sm sm:text-base">{invoice.project}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer & Company Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <User className="h-4 w-4 text-gray-600" />
                Bill To
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Customer ID</p>
                <p className="font-semibold text-sm sm:text-base truncate">{invoice.customer}</p>
              </div>
              {invoice.project && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Project ID</p>
                  <p className="font-semibold text-sm sm:text-base">{invoice.project}</p>
                </div>
              )}
              {invoice.vessel && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Vessel ID</p>
                  <p className="font-semibold text-sm sm:text-base">{invoice.vessel}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-sm sm:text-base">From</CardTitle>
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

        {/* Invoice Items */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Invoice Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-4">
            {/* Mobile View - Cards */}
            <div className="block sm:hidden space-y-3 p-3">
              {invoice.items?.map((item: any, index: number) => (
                <div key={index} className="border rounded-lg p-3 space-y-2 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm">Item {index + 1}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-600">Description</p>
                      <p className="font-medium truncate">{item.description || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Quantity</p>
                      <p className="font-medium">{item.quantity || "0"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Unit Price</p>
                      <p className="font-medium">{formatCurrency(item.unit_price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Amount</p>
                      <p className="font-medium">{formatCurrency(item.amount)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-medium whitespace-nowrap">#</th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-medium whitespace-nowrap">Description</th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-medium whitespace-nowrap">Quantity</th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-medium whitespace-nowrap">Unit Price</th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-medium whitespace-nowrap">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item: any, index: number) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-2 sm:px-3 md:px-4 py-2">{index + 1}</td>
                      <td className="px-2 sm:px-3 md:px-4 py-2 max-w-[200px] truncate">{item.description || "-"}</td>
                      <td className="px-2 sm:px-3 md:px-4 py-2">{item.quantity || "0"}</td>
                      <td className="px-2 sm:px-3 md:px-4 py-2">{formatCurrency(item.unit_price)}</td>
                      <td className="px-2 sm:px-3 md:px-4 py-2">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Summary & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Invoice Summary */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>

                {parseFloat(invoice.cgst) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">CGST ({invoice.cgst}%):</span>
                    <span className="font-medium">{formatCurrency(invoice.cgst)}</span>
                  </div>
                )}

                {parseFloat(invoice.sgst) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">SGST ({invoice.sgst}%):</span>
                    <span className="font-medium">{formatCurrency(invoice.sgst)}</span>
                  </div>
                )}

                {parseFloat(invoice.igst) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">IGST ({invoice.igst}%):</span>
                    <span className="font-medium">{formatCurrency(invoice.igst)}</span>
                  </div>
                )}

                <div className="border-t pt-3">
                  <div className="flex justify-between font-medium text-base">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(totalAmount)}</span>
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
                onClick={() => router.push(`/sales/invoice/${invoiceId}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Invoice
              </Button>
              
              {invoice.status === "Sent" && (
                <Button className="w-full justify-start">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Paid
                </Button>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-800 font-medium text-sm">PDF Available</span>
                </div>
                <InvoiceViewer invoiceId={invoiceId} token={token} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}