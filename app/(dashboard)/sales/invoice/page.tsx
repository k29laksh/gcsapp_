"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Plus,
  FileText,
  DollarSign,
  Clock,
  AlertTriangle,
  Download,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { DataTableEnhanced } from "@/components/ui/data-table-enhanced";
import { PageHeader } from "@/components/ui/page-header";
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
  useGetInvoicesQuery, 
  useDeleteInvoiceMutation,
  useLazyDownloadInvoicePdfQuery 
} from "@/redux/Service/invoice";

interface Invoice {
  id: string;
  invoice_no: string;
  invoice_date: string;
  due_date: string;
  status: string;
  total_amount: string;
  customer: string;
  project: string;
  vessel: string;
  place_of_supply: string;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: string;
    amount: string;
  }>;
  pdf: string;
  cgst: string;
  sgst: string;
  igst: string;
  po_no: string | null;
  our_ref: string | null;
}

interface InvoiceStats {
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
}

export default function InvoicesPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // RTK Query hooks
  const { data: invoices = [], isLoading, error } = useGetInvoicesQuery({});
  const [deleteInvoice] = useDeleteInvoiceMutation();
  const [downloadInvoicePdf] = useLazyDownloadInvoicePdfQuery();

  const [stats, setStats] = useState<InvoiceStats>({
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
  });

  // Calculate stats from invoices data
  useEffect(() => {
    if (invoices && invoices.length > 0) {
      const totalInvoices = invoices.length;
      let paidInvoices = 0;
      let pendingInvoices = 0;
      let overdueInvoices = 0;
      let totalAmount = 0;
      let paidAmount = 0;
      let pendingAmount = 0;
      let overdueAmount = 0;

      invoices.forEach(invoice => {
        const amount = parseFloat(invoice.total_amount);
        totalAmount += amount;

        switch (invoice.status) {
          case "Paid":
            paidInvoices++;
            paidAmount += amount;
            break;
          case "Pending":
            pendingInvoices++;
            pendingAmount += amount;
            break;
          case "Overdue":
            overdueInvoices++;
            overdueAmount += amount;
            break;
          default:
            pendingInvoices++;
            pendingAmount += amount;
        }
      });

      setStats({
        totalInvoices,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        totalAmount,
        paidAmount,
        pendingAmount,
        overdueAmount,
      });
    }
  }, [invoices]);

  // Handle errors from RTK Query
  useEffect(() => {
    if (error) {
      console.error("Error fetching invoices:", error);
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleDelete = async (id: string) => {
    try {
      await deleteInvoice(id).unwrap();
      
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting invoice:", error);
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to delete invoice",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPdf = async (id: string) => {
    try {
      const result = await downloadInvoicePdf(id).unwrap();
      
      // Create a blob URL and trigger download
      const blob = new Blob([result], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Find the invoice to get the invoice number for filename
      const invoice = invoices.find(inv => inv.id === id);
      link.download = `${invoice?.invoice_no || 'invoice'}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      "Draft": "bg-gray-100 text-gray-800",
      "Sent": "bg-blue-100 text-blue-800",
      "Paid": "bg-green-100 text-green-800",
      "Overdue": "bg-red-100 text-red-800",
      "Cancelled": "bg-red-100 text-red-800",
    };
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800";
  };

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: "invoice_no",
      header: "Invoice #",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("invoice_no")}</div>
      ),
    },
    {
      accessorKey: "customer",
      header: "Customer ID",
      cell: ({ row }) => {
        const customerId = row.getValue("customer") as string;
        return <div className="text-sm">{customerId.slice(0, 8)}...</div>;
      },
    },
    {
      accessorKey: "project",
      header: "Project ID",
      cell: ({ row }) => {
        const projectId = row.getValue("project") as string;
        return projectId ? (
          <div className="text-sm">{projectId.slice(0, 8)}...</div>
        ) : (
          <span className="text-muted-foreground">No project</span>
        );
      },
    },
    {
      accessorKey: "invoice_date",
      header: "Invoice Date",
      cell: ({ row }) => formatDate(row.getValue("invoice_date")),
    },
    {
      accessorKey: "due_date",
      header: "Due Date",
      cell: ({ row }) => formatDate(row.getValue("due_date")),
    },
    {
      accessorKey: "total_amount",
      header: "Total Amount",
      cell: ({ row }) => formatCurrency(row.getValue("total_amount")),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge className={getStatusColor(status)}>
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const invoice = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => router.push(`/sales/invoice/${invoice.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/sales/invoice/${invoice.id}/preview`)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDownloadPdf(invoice.id)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push(`/sales/invoice/${invoice.id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the invoice.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(invoice.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const breadcrumbs = [
    { label: "Sales", href: "/sales" },
    { label: "Invoices" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Manage your invoices and track payments"
        breadcrumbs={breadcrumbs}
        action={
          <Button onClick={() => router.push("/sales/invoice/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invoices
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalAmount)} total value
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.paidInvoices}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.paidAmount)} collected
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Invoices
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pendingInvoices}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.pendingAmount)} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overdue Invoices
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.overdueInvoices}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.overdueAmount)} overdue
            </p>
          </CardContent>
        </Card>
      </div>

      <DataTableEnhanced
        columns={columns}
        data={invoices}
        searchKey="invoice_no"
        searchPlaceholder="Search invoices..."
        onAdd={() => router.push("/sales/invoice/new")}
        addLabel="Create Invoice"
        loading={isLoading}
      />
    </div>
  );
}