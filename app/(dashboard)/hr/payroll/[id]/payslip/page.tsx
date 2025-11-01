"use client";
import PayslipViewer from "@/components/PayslipViewer";
import { useSearchParams, useParams } from "next/navigation";

export default function PayslipPage() {
  const { id } = useParams(); // payroll ID from URL
  const searchParams = useSearchParams();
  const userinfo = window.localStorage.getItem('userInfo');
  const token = userinfo ? JSON.parse(userinfo).access : null;

  if (!id || !token) {
    return <p className="p-4 text-red-500">Missing payroll ID or token</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Payslip Viewer</h1>
      <PayslipViewer payrollId={id} token={token} />
    </div>
  );
}
