"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Pencil, FileText, Clock, Award, Clipboard, Calendar, Briefcase } from "lucide-react"

interface EmployeePageProps {
  params: {
    id: string
  }
}

export default function EmployeePage({ params }: EmployeePageProps) {
  const [employee, setEmployee] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchEmployee = async () => {
      const userinfo = localStorage.getItem("userInfo") // Retrieve token from localStorage
      const token = userinfo ? JSON.parse(userinfo).access : null
      if (!token) {
        router.push("/404") // Redirect to 404 if token is missing
        return
      }

      try {
        const response = await fetch(`http://127.0.0.1:8000/employee/${params.id}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          router.push("/404") // Redirect to 404 if employee is not found
          return
        }

        const data = await response.json()
        setEmployee(data)
      } catch (error) {
        console.error("Error fetching employee:", error)
        router.push("/404") // Redirect to 404 on error
      } finally {
        setLoading(false)
      }
    }

    fetchEmployee()
  }, [params.id, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!employee) {
    return null // Render nothing if employee data is not available
  }

  const getInitials = (name: string) => {
    const [firstName, ...lastNameParts] = name.split(" ")
    const lastName = lastNameParts.join(" ")
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getStatusBadge = (status: string) => {
    let color = ""

    switch (status) {
      case "ACTIVE":
        color = "bg-green-500"
        break
      case "INACTIVE":
        color = "bg-gray-500"
        break
      case "ON_LEAVE":
        color = "bg-yellow-500"
        break
      case "TERMINATED":
        color = "bg-red-500"
        break
    }

    return <Badge className={color}>{status.replace("_", " ")}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Employee Details</h2>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/hr/employees/${employee.id}/documents`}>
              <FileText className="mr-2 h-4 w-4" />
              Documents
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/hr/employees/${employee.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex flex-col items-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src="/placeholder.svg" alt={employee.name} />
                <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
              </Avatar>
              <CardTitle className="mt-4 text-center">{employee.name}</CardTitle>
              <CardDescription className="text-center">{employee.job_title}</CardDescription>
              <div className="mt-2">{getStatusBadge(employee.status)}</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Employee ID</div>
                <div className="text-sm">{employee.id}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Department</div>
                <div className="text-sm">{employee.department_name}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Type</div>
                <div className="text-sm">{employee.employment_type}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Joining Date</div>
                <div className="text-sm">{new Date(employee.date_of_joining).toLocaleDateString()}</div>
              </div>
              {employee.date_of_termination && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm font-medium">Termination Date</div>
                  <div className="text-sm">{new Date(employee.date_of_termination).toLocaleDateString()}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Manager</div>
                <div className="text-sm">{employee.managers[0].name || "None"}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="contact">
              <TabsList>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="address">Address</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>
              <TabsContent value="contact" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium">Email</div>
                    <div>{employee.email}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Phone</div>
                    <div>{employee.phone_number || "Not provided"}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium">Emergency Contact</div>
                    <div>{employee.emergencyContactName || "Not provided"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Emergency Phone</div>
                    <div>{employee.emergencyContactPhone || "Not provided"}</div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="address" className="space-y-4 pt-4">
                <div>
                  <div className="text-sm font-medium">Address</div>
                  <div>
                    {employee.address || "Not provided"}
                    {employee.addressLine2 && <div>{employee.addressLine2}</div>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium">City</div>
                    <div>{employee.city || "Not provided"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">State</div>
                    <div>{employee.state || "Not provided"}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium">Postal Code</div>
                    <div>{employee.postalCode || "Not provided"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Country</div>
                    <div>{employee.country || "Not provided"}</div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="financial" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium">Basic Salary</div>
                    <div>{employee.basic_salary ? `₹${employee.basic_salary}` : "Not provided"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Hourly Rate</div>
                    <div>{employee.hourly_rate ? `₹${employee.hourly_rate}/hr` : "Not provided"}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium">Bank Name</div>
                    <div>{employee.bankName || "Not provided"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Account Number</div>
                    <div>{employee.accountNumber || "Not provided"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">IFSC Code</div>
                    <div>{employee.ifscCode || "Not provided"}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium">PAN Number</div>
                    <div>{employee.panNumber || "Not provided"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Aadhar Number</div>
                    <div>{employee.aadharNumber || "Not provided"}</div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="skills" className="pt-4">
                {employee.skills && employee.skills.length > 0 ? (
                  <div className="space-y-4">
                    {employee.skills.map((employeeSkill) => (
                      <div key={employeeSkill.id} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{employeeSkill.skill.name}</div>
                          <Badge>Proficiency: {employeeSkill.proficiencyLevel}/5</Badge>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          {employeeSkill.yearsOfExperience
                            ? `${employeeSkill.yearsOfExperience} years of experience`
                            : "Experience not specified"}
                        </div>
                        {employeeSkill.isCertified && (
                          <div className="mt-2 flex items-center text-sm">
                            <Award className="mr-1 h-4 w-4 text-yellow-500" />
                            Certified: {employeeSkill.certificationName}
                            {employeeSkill.certificationDate &&
                              ` (${new Date(employeeSkill.certificationDate).toLocaleDateString()})`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">No skills recorded</div>
                )}
                <div className="mt-4 flex justify-end">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/hr/employees/${employee.id}/skills`}>
                      <Award className="mr-2 h-4 w-4" />
                      Manage Skills
                    </Link>
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="documents" className="pt-4">
                {employee.documents && employee.documents.length > 0 ? (
                  <div className="space-y-2">
                    {employee.documents.map((document) => (
                      <div key={document.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center">
                          <FileText className="mr-2 h-5 w-5 text-blue-500" />
                          <div>
                            <div className="font-medium">{document.documentName}</div>
                            <div className="text-xs text-muted-foreground">
                              {document.documentType} • Uploaded on {new Date(document.uploadDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={document.documentPath} target="_blank" rel="noopener noreferrer">
                            View
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">No documents uploaded</div>
                )}
                <div className="mt-4 flex justify-end">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/hr/employees/${employee.id}/documents`}>
                      <FileText className="mr-2 h-4 w-4" />
                      Manage Documents
                    </Link>
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Attendance</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/hr/attendance?employeeId=${employee.id}`}>
                <Calendar className="mr-2 h-4 w-4" />
                View All
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* This would be populated with actual attendance data */}
              <div className="text-center text-muted-foreground">No recent attendance records</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Time Entries</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/projects/time?employeeId=${employee.id}`}>
                <Clock className="mr-2 h-4 w-4" />
                View All
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* This would be populated with actual time entry data */}
              <div className="text-center text-muted-foreground">No recent time entries</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Assigned Projects</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/projects?employeeId=${employee.id}`}>
                <Briefcase className="mr-2 h-4 w-4" />
                View All
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* This would be populated with actual project data */}
              <div className="text-center text-muted-foreground">No assigned projects</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Assigned Tasks</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/projects/tasks?assigneeId=${employee.id}`}>
                <Clipboard className="mr-2 h-4 w-4" />
                View All
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* This would be populated with actual task data */}
              <div className="text-center text-muted-foreground">No assigned tasks</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {employee.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line">{employee.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

