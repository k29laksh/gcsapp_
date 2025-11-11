"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import Link from "next/link";

export default function InvoiceDetailsPage() {
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const invoiceId = params.id as string;

  // RTK Query hooks
  const {
    data: invoice,
    isLoading,
    error,
  } = useGetSingleInvoiceQuery(invoiceId);
  const [deleteInvoice] = useDeleteInvoiceMutation();
  const [sendInvoice] = useSendInvoiceMutation();
  const [downloadInvoicePdf] = useLazyDownloadInvoicePdfQuery();
  const pdfUrl = invoice?.pdf;
  // Handle errors from RTK Query
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

  const getStatusBadge = (status: string) => {
    const statusColors = {
      Draft: "bg-gray-100 text-gray-800",
      Sent: "bg-blue-100 text-blue-800",
      Paid: "bg-green-100 text-green-800",
      Overdue: "bg-red-100 text-red-800",
      Cancelled: "bg-red-100 text-red-800",
    };

    return (
      <Badge
        className={
          statusColors[status as keyof typeof statusColors] ||
          "bg-gray-100 text-gray-800"
        }
      >
        {status}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Draft":
        return <FileText className="h-5 w-5 text-gray-500" />;
      case "Sent":
        return <Send className="h-5 w-5 text-blue-500" />;
      case "Paid":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "Overdue":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "Cancelled":
        return <Ban className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
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
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-destructive">Invoice not found</p>
      </div>
    );
  }

  const subtotal = calculateSubtotal();
  const totalTax = calculateTotalTax();
  const totalAmount = parseFloat(invoice.total_amount);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Invoice #{invoice.invoice_no}
          </h1>
          {getStatusBadge(invoice.status)}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={pdfUrl || "#"} // Use the PDF URL
            target="_blank" // Opens the link in a new tab
            rel="noopener noreferrer"
            passHref // Optional: ensures href is passed to the underlying <a> tag
            // Note: className and styles should usually be applied to the Button itself
            // or to the <a> tag if needed, but not usually to the Link component itself.
          >
            <Button
              variant="outline"
              size="sm"
              disabled={!pdfUrl} // Disable button if URL is missing
            >
              <Download className="mr-2 h-4 w-4" />
              View/Download PDF
            </Button>
          </Link>

       

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/sales/invoice/${invoiceId}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  invoice and remove it from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteInvoice}
                  disabled={isDeleting}
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
            <CardDescription>
              Complete information about this invoice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="flex flex-col justify-between gap-4 md:flex-row">
                <div>
                  <h3 className="text-lg font-semibold">
                    Invoice #{invoice.invoice_no}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {getStatusIcon(invoice.status)}
                    <span>Status: {invoice.status}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    Invoice Date
                  </div>
                  <div>{formatDate(invoice.invoice_date)}</div>

                  <div className="mt-2 text-sm text-muted-foreground">
                    Due Date
                  </div>
                  <div>{formatDate(invoice.due_date)}</div>
                </div>
              </div>

              <Separator />

              {/* Customer and Company Info */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-medium">Bill To</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="text-sm text-muted-foreground">Customer ID</p>
                    <p className="font-medium">{invoice.customer}</p>

                    {invoice.project && (
                      <>
                        <p className="text-sm text-muted-foreground mt-2">
                          Project ID
                        </p>
                        <p>{invoice.project}</p>
                      </>
                    )}

                    {invoice.vessel && (
                      <>
                        <p className="text-sm text-muted-foreground mt-2">
                          Vessel ID
                        </p>
                        <p>{invoice.vessel}</p>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium">From</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="font-medium">GCS Services</p>
                    <p>123 Business Park, Suite 456</p>
                    <p>Mumbai, Maharashtra 400001</p>
                    <p>India</p>
                    <p>GSTIN: 27AABCG1234A1Z5</p>
                  </div>
                </div>
              </div>

              {invoice.place_of_supply && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium">Place of Supply</h3>
                    <p className="text-sm mt-1">{invoice.place_of_supply}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* Invoice Items */}
              <div>
                <h3 className="font-medium">Invoice Items</h3>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b text-left text-sm">
                        <th className="pb-2 font-medium">Description</th>
                        <th className="pb-2 font-medium text-right">
                          Quantity
                        </th>
                        <th className="pb-2 font-medium text-right">
                          Unit Price
                        </th>
                        <th className="pb-2 font-medium text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items?.map((item: any, index: number) => (
                        <tr key={index} className="border-b text-sm">
                          <td className="py-3">{item.description}</td>
                          <td className="py-3 text-right">{item.quantity}</td>
                          <td className="py-3 text-right">
                            {formatCurrency(item.unit_price)}
                          </td>
                          <td className="py-3 text-right">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invoice Summary */}
              <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>

                  {parseFloat(invoice.cgst) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>CGST ({invoice.cgst}%):</span>
                      <span>{formatCurrency(invoice.cgst)}</span>
                    </div>
                  )}

                  {parseFloat(invoice.sgst) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>SGST ({invoice.sgst}%):</span>
                      <span>{formatCurrency(invoice.sgst)}</span>
                    </div>
                  )}

                  {parseFloat(invoice.igst) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>IGST ({invoice.igst}%):</span>
                      <span>{formatCurrency(invoice.igst)}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {(invoice.po_no || invoice.our_ref) && (
                <div>
                  <h3 className="font-medium">Additional Information</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    {invoice.po_no && <p>PO Number: {invoice.po_no}</p>}
                    {invoice.our_ref && <p>Our Reference: {invoice.our_ref}</p>}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Invoice Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(invoice.status)}
                  <span className="font-medium">{invoice.status}</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice Date:</span>
                    <span>{formatDate(invoice.invoice_date)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span>{formatDate(invoice.due_date)}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between font-medium">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              {invoice.status === "Sent" && (
                <Button className="w-full" variant="default">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Paid
                </Button>
              )}

             
            </CardFooter>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start mb-2"
                onClick={() => router.push(`/sales/invoice/${invoiceId}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Invoice
              </Button>
              <Link
                href={pdfUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                passHref
                className=""
              >
                <Button variant="outline" size="sm" disabled={!pdfUrl}>
                  <Download className="mr-2 h-4 w-4" />
                  View/Download PDF
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
