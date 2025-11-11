// app/sales/quotations/page.tsx
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/components/ui/use-toast";
import { 
  useGetQuotationsQuery, 
  useDeleteQuotationMutation 
} from "@/redux/Service/quotation";
import { Eye, Edit, Trash2, Download, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: string;
  tax_percent: string;
  total: string;
  plan_type: string;
  delivery_days: number;
  quotation: string;
}

interface Quotation {
  id: string;
  quotation_number: string;
  date: string;
  valid_until: string;
  project: string;
  place_of_supply: string;
  design_scope: string;
  delivery_location: string;
  revision_rounds: number;
  notes: string;
  terms_and_conditions: string;
  customer: string;
  vessel: string;
  items: QuotationItem[];
  status: string;
}

export default function QuotationPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const { data: quotations = [], isLoading, error } = useGetQuotationsQuery();
  const [deleteQuotation] = useDeleteQuotationMutation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
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
    return `${id.slice(0, length)}...`;
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      "Draft": "bg-gray-100 text-gray-800",
      "Sent": "bg-blue-100 text-blue-800",
      "Accepted": "bg-green-100 text-green-800",
      "Rejected": "bg-red-100 text-red-800",
      "Expired": "bg-orange-100 text-orange-800",
    };
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800";
  };

  const getQuotationTotal = (quotation: Quotation) => {
    return quotation.items.reduce((sum, item) => sum + parseFloat(item.total), 0);
  };

  const columns = [
    {
      key: "quotation_number",
      label: "Quotation #",
      sortable: true,
    },
    {
      key: "project",
      label: "Project",
      sortable: true,
      render: (value: string) => value || "No project name",
    },
    {
      key: "customer",
      label: "Customer",
      render: (value: string) => (
        <span className="text-muted-foreground font-mono">
          {shortenId(value)}
        </span>
      ),
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (value: string) => formatDate(value),
    },
    {
      key: "valid_until",
      label: "Valid Until",
      sortable: true,
      render: (value: string) => formatDate(value),
    },
    {
      key: "total_amount",
      label: "Total Amount",
      sortable: true,
      render: (_: any, quotation: Quotation) => {
        const total = getQuotationTotal(quotation);
        return formatCurrency(total);
      },
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
        { value: "Accepted", label: "Accepted" },
        { value: "Rejected", label: "Rejected" },
        { value: "Expired", label: "Expired" },
      ],
    },
  ];

  const actions = [
    {
      type: "view" as const,
      label: "View Details",
      icon: <Eye className="h-4 w-4 mr-2" />,
      href: (quotation: Quotation) => `/sales/quotation/${quotation.id}`,
    },
    {
      type: "edit" as const,
      label: "Edit",
      icon: <Edit className="h-4 w-4 mr-2" />,
      href: (quotation: Quotation) => `/sales/quotation/${quotation.id}/edit`,
    },
    {
      type: "custom" as const,
      label: "Preview",
      icon: <Eye className="h-4 w-4 mr-2" />,
      href: (quotation: Quotation) => `/sales/quotation/${quotation.id}/preview`,
    },
    {
      type: "download" as const,
      label: "Download PDF",
      icon: <Download className="h-4 w-4 mr-2" />,
      onClick: async (quotation: Quotation, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(`/api/sales/quotation/${quotation.id}/pdf`, "_blank");
      },
    },
    {
      type: "delete" as const,
      label: "Delete",
      icon: <Trash2 className="h-4 w-4 mr-2" />,
    },
  ];

  const handleDelete = async (id: string) => {
    await deleteQuotation(id).unwrap();
  };

  const renderMobileCard = (quotation: Quotation) => {
    const total = getQuotationTotal(quotation);
    
    return (
      <div key={quotation.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-card">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="font-semibold text-sm">{quotation.quotation_number}</p>
            <p className="text-xs text-muted-foreground">
              {quotation.project || "No project name"}
            </p>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(quotation.status)}`}>
            {quotation.status}
          </span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer:</span>
            <span className="font-medium font-mono">{shortenId(quotation.customer)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date:</span>
            <span className="font-medium">{formatDate(quotation.date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valid Until:</span>
            <span className="font-medium">{formatDate(quotation.valid_until)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Amount:</span>
            <span className="font-medium">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DataTable
      data={quotations}
      columns={columns}
      actions={actions}
      filters={filters}
      title="Quotations"
      description="Manage your quotations and track customer responses"
      createButton={{
        label: "Create Quotation",
        href: "/sales/quotation/new",
      }}
      isLoading={isLoading}
      error={error}
      onDelete={handleDelete}
      renderMobileCard={renderMobileCard}
    />
  );
}