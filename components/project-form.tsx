"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Ship } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { useGetCustomersQuery } from "@/redux/Service/customer";
import { useGetEmployeeQuery } from "@/redux/Service/employee";
import { useGetVesselsQuery } from "@/redux/Service/vessel";
import {
  useAddProjectMutation,
  useUpdateProjectMutation,
} from "@/redux/Service/projects";

interface ProjectFormProps {
  project?: any;
  isEditing?: boolean;
}

export function ProjectForm({ project, isEditing = false }: ProjectFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // RTK Queries
  const { data: customersData = [], isLoading: customersLoading } =
    useGetCustomersQuery();
  const { data: employeesData = [], isLoading: employeesLoading } =
    useGetEmployeeQuery();
  const { data: vesselsData = [], isLoading: vesselsLoading } =
    useGetVesselsQuery();

  // RTK Mutations
  const [addProject] = useAddProjectMutation();
  const [updateProject] = useUpdateProjectMutation();

  const [formData, setFormData] = useState({
    name: project?.name || "",
    type: project?.type || "Design",
    description: project?.description || "",
    status: project?.status || "Active",
    priority: project?.priority || "High",
    design_phase: project?.design_phase || "Phase 1",
    customer: project?.customer || "",
    vessel: project?.vessel || "",
    regulatory_body: project?.regulatory_body || "",
    classification_society: project?.classification_society || "",
    start_date: project?.start_date ? new Date(project.start_date) : new Date(),
    end_date: project?.end_date
      ? new Date(project.end_date)
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    terms: project?.terms || "",
    manager: project?.manager || "",
    notes: project?.notes || "",
    budget: project?.budget || "",
    value: project?.value || "",
    enable_payments: project?.enable_payments || false,
  });

  // Static data
  const projectTypes = [
    "Design",
    "Construction",
    "Repair",
    "Modification",
    "Survey",
    "Consulting",
    "Research",
    "Other",
  ];

  const projectStatuses = [
    "Active",
    "Planning",
    "In Progress",
    "On Hold",
    "Completed",
    "Cancelled",
  ];

  const priorities = ["Low", "Medium", "High", "Urgent", "Critical"];

  const designPhases = [
    "Phase 1",
    "Phase 2",
    "Phase 3",
    "Concept",
    "Preliminary",
    "Detailed",
    "Approval",
    "Final",
  ];

  const regulatoryBodies = [
    "Indian Maritime Authority",
    "DG Shipping (India)",
    "IRS (Indian Register of Shipping)",
    "Lloyd's Register",
    "DNV GL",
    "ABS (American Bureau of Shipping)",
    "BV (Bureau Veritas)",
    "CCS (China Classification Society)",
    "NK (Nippon Kaiji Kyokai)",
    "RINA",
    "Other",
  ];

  const classificationSocieties = [
    "Lloyd's Register",
    "DNV",
    "ABS (American Bureau of Shipping)",
    "BV (Bureau Veritas)",
    "IRS (Indian Register of Shipping)",
    "CCS (China Classification Society)",
    "NK (Nippon Kaiji Kyokai)",
    "RINA",
    "Other",
  ];

  // Filter active employees
  const activeEmployees = employeesData.filter(
    (emp: any) => emp.status === "active"
  );

  // Filter vessels based on selected customer
  const filteredVessels = formData.customer
    ? vesselsData.filter((vessel: any) => vessel.owner === formData.customer)
    : vesselsData;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Reset vessel when customer changes
    if (name === "customer") {
      setFormData((prev) => ({ ...prev, vessel: "" }));
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? "" : Number(value),
    }));
  };

  const formatDateForAPI = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error("Project name is required");
      }

      if (!formData.customer) {
        throw new Error("Please select a customer");
      }

      // Prepare data for submission
      const dataToSend = {
        ...formData,
        start_date: formatDateForAPI(formData.start_date),
        end_date: formatDateForAPI(formData.end_date),
        budget: formData.budget ? Number(formData.budget) : 0,
        value: formData.value ? Number(formData.value) : 0,
        // Ensure empty strings are handled properly
        vessel: formData.vessel || undefined,
        manager: formData.manager || undefined,
      };

      console.log("Submitting project data:", dataToSend);

      if (isEditing && project?.id) {
        // Update project
        await updateProject({ id: project.id, ...dataToSend }).unwrap();
        toast({
          title: "Success",
          description: "Project updated successfully",
        });
      } else {
        // Create new project
        await addProject(dataToSend).unwrap();
        toast({
          title: "Success",
          description: "Project created successfully",
        });
      }

      router.push("/projects");
      router.refresh();
    } catch (error: any) {
      console.error("Error saving project:", error);
      toast({
        title: "Error",
        description:
          error?.data?.message ||
          error?.message ||
          `Failed to ${isEditing ? "update" : "create"} project`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbs = [
    { label: "Projects", href: "/projects" },
    { label: isEditing ? "Edit Project" : "New Project" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? "Edit Marine Project" : "New Marine Project"}
        description={
          isEditing
            ? "Update project details"
            : "Create a new marine design project"
        }
        breadcrumbs={breadcrumbs}
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ship className="h-5 w-5" />
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="vessel">Vessel Details</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="management">Management</TabsTrigger>
                <TabsTrigger value="commercial">Commercial</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Project Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Hull Design Project"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Project Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        handleSelectChange("type", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Project Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Detailed description of the marine design project..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Project Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        handleSelectChange("status", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        handleSelectChange("priority", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priority}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="design_phase">Design Phase</Label>
                  <Select
                    value={formData.design_phase}
                    onValueChange={(value) =>
                      handleSelectChange("design_phase", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select design phase" />
                    </SelectTrigger>
                    <SelectContent>
                      {designPhases.map((phase) => (
                        <SelectItem key={phase} value={phase}>
                          {phase}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="vessel" className="space-y-4">
                <div>
                  <Label htmlFor="customer">Customer *</Label>
                  <Select
                    value={formData.customer}
                    onValueChange={(value) =>
                      handleSelectChange("customer", value)
                    }
                    disabled={customersLoading}
                  >
                    <SelectTrigger>
                      {customersLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading customers...
                        </div>
                      ) : (
                        <SelectValue placeholder="Select customer" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {customersData.map((customer: any) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.company_name || customer.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="vessel">Vessel (Optional)</Label>
                  <Select
                    value={formData.vessel}
                    onValueChange={(value) =>
                      handleSelectChange("vessel", value)
                    }
                    disabled={vesselsLoading || !formData.customer}
                  >
                    <SelectTrigger>
                      {vesselsLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading vessels...
                        </div>
                      ) : (
                        <SelectValue
                          placeholder={
                            formData.customer
                              ? "Select vessel"
                              : "Select customer first"
                          }
                        />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {filteredVessels.length === 0 ? (
                        <SelectItem value="no-vessel" disabled>
                          No vessels found for this customer
                        </SelectItem>
                      ) : (
                        filteredVessels.map((vessel: any) => (
                          <SelectItem key={vessel.id} value={vessel.id}>
                            {vessel.name} - {vessel.type} ({vessel.imo_number})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="regulatory_body">Regulatory Body</Label>
                    <Select
                      value={formData.regulatory_body}
                      onValueChange={(value) =>
                        handleSelectChange("regulatory_body", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select regulatory body" />
                      </SelectTrigger>
                      <SelectContent>
                        {regulatoryBodies.map((body) => (
                          <SelectItem key={body} value={body}>
                            {body}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="classification_society">
                      Classification Society
                    </Label>
                    <Select
                      value={formData.classification_society}
                      onValueChange={(value) =>
                        handleSelectChange("classification_society", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select classification society" />
                      </SelectTrigger>
                      <SelectContent>
                        {classificationSocieties.map((society) => (
                          <SelectItem key={society} value={society}>
                            {society}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Project Start Date</Label>
                    <DatePicker
                      date={formData.start_date}
                      setDate={(date) =>
                        setFormData((prev) => ({ ...prev, start_date: date }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Target End Date</Label>
                    <DatePicker
                      date={formData.end_date}
                      setDate={(date) =>
                        setFormData((prev) => ({ ...prev, end_date: date }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="terms">Terms & Conditions</Label>
                  <Textarea
                    id="terms"
                    name="terms"
                    value={formData.terms}
                    onChange={handleChange}
                    placeholder="Specify payment terms, milestones, and conditions..."
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="management" className="space-y-4">
                <div>
                  <Label htmlFor="manager">Project Manager</Label>
                  <Select
                    value={formData.manager}
                    onValueChange={(value) =>
                      handleSelectChange("manager", value)
                    }
                    disabled={employeesLoading}
                  >
                    <SelectTrigger>
                      {employeesLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading employees...
                        </div>
                      ) : (
                        <SelectValue placeholder="Select project manager" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {/* Remove the empty value Select.Item and add a placeholder option */}
                      {activeEmployees.length === 0 ? (
                        <SelectItem value="no-managers" disabled>
                          No managers available
                        </SelectItem>
                      ) : (
                        activeEmployees.map((employee: any) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name} - {employee.job_title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {!formData.manager && activeEmployees.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      No manager selected
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes">Project Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Additional notes, special requirements, or important information..."
                    rows={4}
                  />
                </div>
              </TabsContent>

              <TabsContent value="commercial" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budget">Project Budget (₹)</Label>
                    <Input
                      id="budget"
                      name="budget"
                      type="number"
                      value={formData.budget}
                      onChange={handleNumberChange}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="value">Contract Value (₹)</Label>
                    <Input
                      id="value"
                      name="value"
                      type="number"
                      value={formData.value}
                      onChange={handleNumberChange}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enable_payments"
                    checked={formData.enable_payments}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(
                        "enable_payments",
                        checked as boolean
                      )
                    }
                  />
                  <Label htmlFor="enable_payments">
                    Enable milestone-based payments
                  </Label>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading
                ? "Saving..."
                : isEditing
                ? "Update Project"
                : "Create Project"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
