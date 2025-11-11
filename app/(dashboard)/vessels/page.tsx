// app/vessels/page.tsx
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";
import {
  useGetVesselsQuery,
  useDeleteVesselMutation,
} from "@/redux/Service/vessel";
import { Eye, Edit, Trash2, Ship } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Vessel {
  id: string;
  name: string;
  imo_number: string;
  type: string;
  flag_state: string;
  classification_society: string;
  class_notation: string;
  build_year: number;
  shipyard: string;
  length_overall: string;
  breadth: string;
  depth: string;
  gross_tonnage: number;
  net_tonnage: number;
  deadweight: number;
  created_at: string;
  owner: string;
  owner_details?: {
    id: string;
    company_name?: string;
    first_name?: string;
    last_name?: string;
  };
}

export default function VesselsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const { data: vessels = [], isLoading, error } = useGetVesselsQuery();
  const [deleteVessel] = useDeleteVesselMutation();

  const shortenId = (id: string, length: number = 8) => {
    return `${id.slice(0, length)}...`;
  };

  const formatOwnerName = (vessel: Vessel) => {
    if (vessel.owner_details?.company_name) {
      return vessel.owner_details.company_name;
    }
    if (vessel.owner_details?.first_name) {
      return `${vessel.owner_details.first_name} ${vessel.owner_details.last_name || ''}`;
    }
    return vessel.owner ? shortenId(vessel.owner) : "N/A";
  };

  const columns = [
    {
      key: "name",
      label: "Vessel Name",
      sortable: true,
      render: (value: string, vessel: Vessel) => (
        <div className="flex items-center gap-2">
          <Ship className="h-4 w-4 text-blue-600" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "imo_number",
      label: "IMO Number",
      render: (value: string) => value || "N/A",
    },
    {
      key: "type",
      label: "Type",
      render: (value: string) => (
        <Badge variant="outline">{value}</Badge>
      ),
    },
    {
      key: "owner",
      label: "Owner",
      render: (_: any, vessel: Vessel) => formatOwnerName(vessel),
    },
    {
      key: "gross_tonnage",
      label: "Gross Tonnage",
      sortable: true,
      render: (value: number) => value ? `${value.toLocaleString()} GT` : "N/A",
      className: "text-right",
    },
    {
      key: "length_overall",
      label: "Length",
      render: (value: string) => value ? `${value}m` : "N/A",
    },
    {
      key: "build_year",
      label: "Built",
      sortable: true,
      render: (value: number) => value || "N/A",
    },
  ];

  const filters = [
    {
      key: "type",
      label: "Vessel Type",
      type: "select" as const,
      options: [
        { value: "Bulk Carrier", label: "Bulk Carrier" },
        { value: "Tanker", label: "Tanker" },
        { value: "Container Ship", label: "Container Ship" },
        { value: "General Cargo", label: "General Cargo" },
        { value: "Passenger Ship", label: "Passenger Ship" },
        { value: "Offshore Vessel", label: "Offshore Vessel" },
      ],
    },
  ];

  const actions = [
    {
      type: "view" as const,
      label: "View Details",
      icon: <Eye className="h-4 w-4 mr-2" />,
      href: (vessel: Vessel) => `/vessels/${vessel.id}`,
    },
    {
      type: "edit" as const,
      label: "Edit",
      icon: <Edit className="h-4 w-4 mr-2" />,
      href: (vessel: Vessel) => `/vessels/${vessel.id}/edit`,
    },
    {
      type: "delete" as const,
      label: "Delete",
      icon: <Trash2 className="h-4 w-4 mr-2" />,
    },
  ];

  const handleDelete = async (id: string) => {
    await deleteVessel(id).unwrap();
  };

  const renderMobileCard = (vessel: Vessel) => (
    <div key={vessel.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-card">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Ship className="h-4 w-4 text-blue-600" />
          <div>
            <p className="font-semibold text-sm">{vessel.name}</p>
            <p className="text-xs text-muted-foreground">
              {vessel.imo_number || "No IMO number"}
            </p>
          </div>
        </div>
        <Badge variant="outline">{vessel.type}</Badge>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Owner:</span>
          <span className="font-medium">{formatOwnerName(vessel)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Gross Tonnage:</span>
          <span className="font-medium">{vessel.gross_tonnage ? `${vessel.gross_tonnage.toLocaleString()} GT` : "N/A"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Length:</span>
          <span className="font-medium">{vessel.length_overall ? `${vessel.length_overall}m` : "N/A"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Built:</span>
          <span className="font-medium">{vessel.build_year || "N/A"}</span>
        </div>
      </div>
    </div>
  );

  return (
    <DataTable
      data={vessels}
      columns={columns}
      actions={actions}
      filters={filters}
      title="Vessels"
      description="Manage vessel information and specifications"
      createButton={{
        label: "Add Vessel",
        href: "/vessels/new",
      }}
      isLoading={isLoading}
      error={error}
      onDelete={handleDelete}
      renderMobileCard={renderMobileCard}
    />
  );
}