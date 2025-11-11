"use client";
import PayslipViewer from "@/components/PayslipViewer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useSearchParams, useParams, useRouter } from "next/navigation";

export default function PayslipPage() {
  const { id } = useParams(); // payroll ID from URL
  const searchParams = useSearchParams();
  const userinfo = window.localStorage.getItem('userInfo');
  const token = userinfo ? JSON.parse(userinfo).access : null;
    const router = useRouter()
  

  if (!id || !token) {
    return <p className="p-4 text-red-500">Missing payroll ID or token</p>;
  }

  return (
    <div className="">
      <Button variant="outline" onClick={() => router.push(`/hr/payroll/${id}`)} className="mb-4 sm:mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
      
      <PayslipViewer payrollId={id} token={token} />
    </div>
  );
}
