"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { VendorForm } from "@/components/vendor-form"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export default function EditVendorPage() {
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const { toast } = useToast()

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/purchase/vendor/${params.id}`)

        if (!response.ok) throw new Error("Failed to fetch vendor")

        const data = await response.json()
        setVendor(data)
      } catch (error) {
        console.error("Error fetching vendor:", error)
        toast({
          title: "Error",
          description: "Failed to load vendor",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchVendor()
  }, [params.id, toast])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading vendor data...</p>
        </div>
      </div>
    )
  }

  return vendor ? <VendorForm vendor={vendor} isEditing /> : null
}
