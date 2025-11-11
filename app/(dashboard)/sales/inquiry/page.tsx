// app/sales/inquiries/page.tsx
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";
import { useGetInquiriesQuery, useDeleteInquiryMutation } from "@/redux/Service/inquiry";
import { Eye, Edit, Trash2, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Inquiry {
  id: string;
  date: string;
  subject: string;
  requirements: string;
  source: string;
  status: string;
  budget: number;
  timeline: string;
  follow_up_date: string;
  notes: string;
  assigned_to: string;
}

export default function InquiryListPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: inquiries = [], isLoading, error } = useGetInquiriesQuery();
  const [deleteInquiry] = useDeleteInquiryMutation();

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "Pending": "bg-yellow-100 text-yellow-800",
      "In Progress": "bg-blue-100 text-blue-800",
      "Completed": "bg-green-100 text-green-800",
      "Cancelled": "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      "Email": "bg-blue-100 text-blue-800 border-blue-200",
      "Phone": "bg-green-100 text-green-800 border-green-200",
      "Website": "bg-purple-100 text-purple-800 border-purple-200",
      "Referral": "bg-orange-100 text-orange-800 border-orange-200",
    };
    return colors[source] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return "Not specified";
    return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  };

  const columns = [
    {
      key: "subject",
      label: "Subject",
      sortable: true,
      render: (value: string) => (
        <div className="line-clamp-2">{value}</div>
      ),
    },
    {
      key: "id",
      label: "ID",
      render: (value: string) => (
        <span className="font-mono text-muted-foreground">
          {value.slice(0, 8)}...
        </span>
      ),
    },
    {
      key: "requirements",
      label: "Requirements",
      render: (value: string) => (
        <div className="line-clamp-2 text-muted-foreground">{value}</div>
      ),
    },
    {
      key: "source",
      label: "Source",
      render: (value: string) => (
        <span className={`text-xs font-medium px-3 py-1 rounded-full border ${getSourceColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: "budget",
      label: "Budget",
      sortable: true,
      render: (value: number) => formatCurrency(value),
      className: "text-right",
    },
    {
      key: "timeline",
      label: "Timeline",
      render: (value: string) => value || "Not specified",
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (value: string) => formatDate(value),
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
        { value: "Pending", label: "Pending" },
        { value: "In Progress", label: "In Progress" },
        { value: "Completed", label: "Completed" },
        { value: "Cancelled", label: "Cancelled" },
      ],
    },
    {
      key: "source",
      label: "Source",
      type: "select" as const,
      options: [
        { value: "Email", label: "Email" },
        { value: "Phone", label: "Phone" },
        { value: "Website", label: "Website" },
        { value: "Referral", label: "Referral" },
      ],
    },
  ];

  const handleCreateQuotation = async (inquiry: Inquiry, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/sales/quotation/new?inquiryId=${inquiry.id}`);
  };

  const actions = [
    {
      type: "view" as const,
      label: "View Details",
      icon: <Eye className="h-4 w-4 mr-2" />,
      href: (inquiry: Inquiry) => `/sales/inquiry/${inquiry.id}`,
    },
    {
      type: "edit" as const,
      label: "Edit",
      icon: <Edit className="h-4 w-4 mr-2" />,
      href: (inquiry: Inquiry) => `/sales/inquiry/${inquiry.id}/edit`,
    },
    {
      type: "custom" as const,
      label: "Create Quotation",
      icon: <FileText className="h-4 w-4 mr-2" />,
      onClick: handleCreateQuotation,
      condition: (inquiry: Inquiry) => inquiry.status === "In Progress",
    },
    {
      type: "delete" as const,
      label: "Delete",
      icon: <Trash2 className="h-4 w-4 mr-2" />,
    },
  ];

  const handleDelete = async (id: string) => {
    await deleteInquiry(id).unwrap();
  };

  const renderMobileCard = (inquiry: Inquiry) => (
    <div key={inquiry.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-card">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-semibold text-sm line-clamp-1">{inquiry.subject}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {inquiry.id.slice(0, 8)}...
          </p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(inquiry.status)}`}>
          {inquiry.status}
        </span>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Source:</span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getSourceColor(inquiry.source)}`}>
            {inquiry.source}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Budget:</span>
          <span className="font-medium">{formatCurrency(inquiry.budget)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Timeline:</span>
          <span className="font-medium">{inquiry.timeline || "Not specified"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date:</span>
          <span className="font-medium">{formatDate(inquiry.date)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <DataTable
      data={inquiries}
      columns={columns}
      actions={actions}
      filters={filters}
      title="Sales Inquiries"
      description="Manage and track customer inquiries"
      createButton={{
        label: "New Inquiry",
        href: "/sales/inquiry/new",
      }}
      isLoading={isLoading}
      error={error}
      onDelete={handleDelete}
      renderMobileCard={renderMobileCard}
    />
  );
}