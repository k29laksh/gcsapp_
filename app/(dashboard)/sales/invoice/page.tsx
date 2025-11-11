// app/sales/invoices/page.tsx
"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/components/ui/use-toast";
import { 
  useGetInvoicesQuery, 
  useDeleteInvoiceMutation,
  useLazyDownloadInvoicePdfQuery 
} from "@/redux/Service/invoice";
import { Eye, Edit, Trash2, Download } from "lucide-react";
import Link from "next/link";

export default function InvoicesPage() {
  const { toast } = useToast();
  const { data: invoices = [], isLoading, error } = useGetInvoicesQuery({});
  const [deleteInvoice] = useDeleteInvoiceMutation();
  const [downloadInvoicePdf] = useLazyDownloadInvoicePdfQuery();

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

  const shortenId = (id: string, length: number = 8) => {
    if (!id) return "N/A";
    return `${id.slice(0, length)}...`;
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      "Draft": "bg-gray-100 text-gray-800",
      "Sent": "bg-blue-100 text-blue-800",
      "Paid": "bg-green-100 text-green-800",
      "Overdue": "bg-red-100 text-red-800",
      "Cancelled": "bg-red-100 text-red-800",
      "Pending": "bg-yellow-100 text-yellow-800",
    };
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800";
  };

  const columns = [
    {
      key: "invoice_no",
      label: "Invoice #",
      sortable: true,
    },
    {
      key: "customer",
      label: "Customer",
      sortable: true,
      render: (value: string) => (
        <span className="font-mono text-muted-foreground">
          {shortenId(value)}
        </span>
      ),
    },
    {
      key: "project",
      label: "Project",
      render: (value: string) => (
        <span className="font-mono text-muted-foreground">
          {value ? shortenId(value) : "No project"}
        </span>
      ),
    },
    {
      key: "invoice_date",
      label: "Invoice Date",
      sortable: true,
      render: (value: string) => formatDate(value),
    },
    {
      key: "due_date",
      label: "Due Date",
      sortable: true,
      render: (value: string) => formatDate(value),
    },
    {
      key: "total_amount",
      label: "Amount",
      sortable: true,
      render: (value: string) => formatCurrency(value),
      className: "text-right",
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(value)}`}>
          {value}
        </span>
      ),
    },
  ];

  const filters = [
    {
      key: "status",
      label: "Status",
      type: "select" as const,
      options: [
        { value: "Draft", label: "Draft" },
        { value: "Sent", label: "Sent" },
        { value: "Paid", label: "Paid" },
        { value: "Pending", label: "Pending" },
        { value: "Overdue", label: "Overdue" },
        { value: "Cancelled", label: "Cancelled" },
      ],
    },
  ];

  const actions = [
    {
      type: "view" as const,
      label: "View Details",
      icon: <Eye className="h-4 w-4 mr-2" />,
      href: (item: any) => `/sales/invoice/${item.id}`,
    },
    {
      type: "download" as const,
      label: "Download PDF",
      icon: <Download className="h-4 w-4 mr-2" />,
    },
    {
      type: "edit" as const,
      label: "Edit",
      icon: <Edit className="h-4 w-4 mr-2" />,
      href: (item: any) => `/sales/invoice/${item.id}/edit`,
    },
    {
      type: "delete" as const,
      label: "Delete",
      icon: <Trash2 className="h-4 w-4 mr-2" />,
    },
  ];

  const handleDelete = async (id: string) => {
    await deleteInvoice(id).unwrap();
  };

  const handleDownload = async (id: string) => {
    const result = await downloadInvoicePdf(id).unwrap();
    const invoice = invoices.find(inv => inv.id === id);
    const blob = new Blob([result], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice?.invoice_no || 'invoice'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const renderMobileCard = (invoice: any) => (
    <Link key={invoice.id} href={`/sales/invoice/${invoice.id}`}>
      <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-card">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="font-semibold text-sm">{invoice.invoice_no}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {shortenId(invoice.customer)}
            </p>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(invoice.status)}`}>
            {invoice.status}
          </span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Project:</span>
            <span className="font-medium font-mono">
              {invoice.project ? shortenId(invoice.project) : "No project"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-medium">{formatCurrency(invoice.total_amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Due Date:</span>
            <span className="font-medium">{formatDate(invoice.due_date)}</span>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <DataTable
      data={invoices}
      columns={columns}
      actions={actions}
      filters={filters}
      title="Invoices"
      description="Manage your invoices and track payments"
      createButton={{
        label: "Create Invoice",
        href: "/sales/invoice/new",
      }}
      isLoading={isLoading}
      error={error}
      onDelete={handleDelete}
      onDownload={handleDownload}
      renderMobileCard={renderMobileCard}
    />
  );
}