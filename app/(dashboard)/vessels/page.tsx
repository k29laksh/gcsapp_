// app/vessels/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Ship, Loader2 } from "lucide-react"
import { DataTable } from "@/components/data-table"
import { useToast } from "@/hooks/use-toast"
import {
  useGetVesselsQuery,
  useDeleteVesselMutation,
} from "@/redux/Service/vessel"

interface Vessel {
  id: string
  name: string
  imo_number: string
  type: string
  flag_state: string
  classification_society: string
  class_notation: string
  build_year: number
  shipyard: string
  length_overall: string
  breadth: string
  depth: string
  gross_tonnage: number
  net_tonnage: number
  deadweight: number
  created_at: string
  owner: string
  owner_details?: {
    id: string
    company_name?: string
    first_name?: string
    last_name?: string
  }
}

export default function VesselsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")

  // RTK Query hooks
  const { 
    data: vessels = [], 
    isLoading, 
    error,
    refetch 
  } = useGetVesselsQuery()
  console.log("Vessels data:", vessels)
  const [deleteVessel] = useDeleteVesselMutation()

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load vessels",
        variant: "destructive",
      })
    }
  }, [error, toast])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vessel?")) return

    try {
      await deleteVessel(id).unwrap()
      toast({
        title: "Success",
        description: "Vessel deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting vessel:", error)
      toast({
        title: "Error",
        description: "Failed to delete vessel",
        variant: "destructive",
      })
    }
  }

  const filteredVessels = vessels.filter((vessel: Vessel) =>
    vessel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vessel.imo_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vessel.owner_details?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${vessel.owner_details?.first_name} ${vessel.owner_details?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const columns = [
    {
      accessorKey: "name",
      header: "Vessel Name",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <Ship className="h-4 w-4 text-blue-600" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "imo_number",
      header: "IMO Number",
      cell: ({ row }: any) => row.original.imo_number || "N/A",
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }: any) => <Badge variant="outline">{row.original.type}</Badge>,
    },
    {
      accessorKey: "owner",
      header: "Owner",
      cell: ({ row }: any) => {
        const owner = row.original.owner
        return owner || "N/A"
      },
    },
    {
      accessorKey: "gross_tonnage",
      header: "GT",
      cell: ({ row }: any) => row.original.gross_tonnage ? `${row.original.gross_tonnage.toLocaleString()} GT` : "N/A",
    },
    {
      accessorKey: "length_overall",
      header: "LOA",
      cell: ({ row }: any) => row.original.length_overall ? `${row.original.length_overall}m` : "N/A",
    },
    {
      accessorKey: "build_year",
      header: "Built",
      cell: ({ row }: any) => row.original.build_year || "N/A",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push(`/vessels/${row.original.id}`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Vessels</h1>
          <p className="text-muted-foreground">Manage vessel information and specifications</p>
        </div>
        <Button onClick={() => router.push("/vessels/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vessel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Vessels ({filteredVessels.length})</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vessels..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredVessels} />
        </CardContent>
      </Card>
    </div>
  )
}
