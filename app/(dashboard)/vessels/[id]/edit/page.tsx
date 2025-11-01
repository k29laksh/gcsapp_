// app/vessels/[id]/edit/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { VesselForm } from "@/components/vessel-form"
import { PageHeader } from "@/components/ui/page-header"
import { useToast } from "@/hooks/use-toast"
import { useGetSingleVesselQuery } from "@/redux/Service/vessel"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function EditVesselPage() {
  const params = useParams()
  const { toast } = useToast()
  const vesselId = params.id as string

  const { data: vesselData, isLoading, error } = useGetSingleVesselQuery(vesselId)

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load vessel details",
        variant: "destructive",
      })
    }
  }, [error, toast])

  const breadcrumbs = [
    { label: "Vessels", href: "/vessels" },
    { label: "Edit Vessel" },
  ]

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <PageHeader title="Edit Vessel" description="Update vessel information" breadcrumbs={breadcrumbs} />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Loading vessel details...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !vesselData) {
    return (
      <div className="container mx-auto py-6">
        <PageHeader title="Edit Vessel" description="Update vessel information" breadcrumbs={breadcrumbs} />
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {error ? "Failed to load vessel details." : "Vessel not found."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <PageHeader title="Edit Vessel" description="Update vessel information" breadcrumbs={breadcrumbs} />
      <VesselForm vessel={vesselData} isEditing />
    </div>
  )
}