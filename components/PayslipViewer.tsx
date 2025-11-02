"use client";
import React, { useState, useEffect } from "react";

const PayslipViewer = ({ payrollId, token }) => {
  const [loading, setLoading] = useState(false);
  const [pdfSrc, setPdfSrc] = useState(null);
  const pdfUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/payroll/${payrollId}/generate-pdf/`;

  // Automatically fetch the PDF when component mounts
  useEffect(() => {
    const fetchPdf = async () => {
      if (!token || !payrollId) {
        alert("Missing payroll ID or token!");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(pdfUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(err.error || "Failed to fetch payslip");
          return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setPdfSrc(url);
      } catch (err) {
        console.error("Error fetching PDF:", err);
        alert("Error loading payslip. Try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPdf();
  }, [payrollId, token]);

  // Download handler (still manual)
  const downloadPayslip = async () => {
    if (!token || !payrollId) {
      alert("Missing payroll ID or token!");
      return;
    }

    try {
      const res = await fetch(pdfUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to download payslip");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip_${payrollId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading:", err);
      alert("Error downloading payslip. Try again.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* <button
        onClick={downloadPayslip}
        disabled={loading}
        style={{
          backgroundColor: "#28a745",
          color: "white",
          padding: "8px 16px",
          borderRadius: "6px",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          alignSelf: "flex-start",
        }}
      >
        {loading ? "Loading PDF..." : "Download"}
      </button> */}

      {/* Inline PDF Viewer */}
      {pdfSrc ? (
        <div
          style={{
            marginTop: "1rem",
            width: "100%",
            height: "80vh",
            border: "1px solid #ccc",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <iframe
            src={pdfSrc}
            width="100%"
            height="100%"
            title="Payslip PDF"
            style={{ border: "none" }}
          />
        </div>
      ) : (
        <p style={{ textAlign: "center", marginTop: "2rem", color: "#555" }}>
          {loading ? "Fetching payslip..." : "No payslip available."}
        </p>
      )}
    </div>
  );
};

export default PayslipViewer;
