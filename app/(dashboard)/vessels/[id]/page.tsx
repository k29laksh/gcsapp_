// app/vessels/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Pencil, Loader2, Ship, MapPin, Calendar, Building } from "lucide-react"
import { useGetSingleVesselQuery } from "@/redux/Service/vessel"

export default function VesselDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const vesselId = params.id as string

  const { data: vessel, isLoading, error } = useGetSingleVesselQuery(vesselId)

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load vessel details",
        variant: "destructive",
      })
    }
  }, [error, toast])

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Loading vessel details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !vessel) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            {error ? "Failed to load vessel details." : "Vessel not found."}
          </p>
          <Button onClick={() => router.push("/vessels")}>
            Back to Vessels
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/vessels">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{vessel.name}</h1>
            <p className="text-muted-foreground">Vessel Details</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/vessels/${vessel.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ship className="h-5 w-5" />
              Vessel Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">IMO Number</h3>
                  <p className="text-lg">{vessel.imo_number || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Vessel Type</h3>
                  <Badge variant="outline">{vessel.type}</Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Flag State</h3>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{vessel.flag_state || "N/A"}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Classification Society</h3>
                  <p>{vessel.classification_society || "N/A"}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Class Notation</h3>
                  <p>{vessel.class_notation || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Build Year</h3>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{vessel.build_year || "N/A"}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Shipyard</h3>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{vessel.shipyard || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dimensions & Tonnage */}
        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Length Overall</h3>
                <p className="text-lg">{vessel.length_overall ? `${vessel.length_overall}m` : "N/A"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Breadth</h3>
                <p className="text-lg">{vessel.breadth ? `${vessel.breadth}m` : "N/A"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Depth</h3>
                <p className="text-lg">{vessel.depth ? `${vessel.depth}m` : "N/A"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Gross Tonnage</h3>
                <p className="text-lg">{vessel.gross_tonnage ? `${vessel.gross_tonnage.toLocaleString()} GT` : "N/A"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Net Tonnage</h3>
                <p className="text-lg">{vessel.net_tonnage ? `${vessel.net_tonnage.toLocaleString()} NT` : "N/A"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Deadweight</h3>
                <p className="text-lg">{vessel.deadweight ? `${vessel.deadweight.toLocaleString()} DWT` : "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}