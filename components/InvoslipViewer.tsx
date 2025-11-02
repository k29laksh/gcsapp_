"use client";
import React, { useState } from "react";

const InvoiceViewer = ({ invoiceId, token }) => {
  const [viewLoading, setViewLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [pdfSrc, setPdfSrc] = useState(null); // store PDF URL for inline view
  const pdfUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/invoices/${invoiceId}/generate-pdf/`;

  // 🔹 Inline view (within same page)
  const viewInvoice = async () => {
    if (!token || !invoiceId) {
      alert("Missing invoice ID or token!");
      return;
    }

    setViewLoading(true);
    try {
      // Fetch PDF as blob
      const res = await fetch(`${pdfUrl}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to fetch invoslip");
        return;
      }

      // Convert blob to a URL for inline display
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfSrc(url);
    } catch (err) {
      console.error("Error fetching PDF:", err);
      alert("Error loading invoslip. Try again.");
    } finally {
      setViewLoading(false);
    }
  };

  // 🔹 Download PDF file
  const downloadinvoslip = async () => {
    if (!token || !invoiceId) {
      alert("Missing Invoice ID or token!");
      return;
    }
    setDownloadLoading(true);
    try {
      const res = await fetch(pdfUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to download invoslip");
        return;
      }

      const blob = await res.blob();
      if (!blob.size) {
        alert("Empty PDF received");
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoslip_${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading:", err);
      alert("Error downloading invoiceSlip. Try again.");
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "1rem" }}>
        <button
          onClick={viewInvoice}
          disabled={viewLoading || downloadLoading}
          style={{
            backgroundColor: "#007bff",
            color: "white",
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            cursor: (viewLoading || downloadLoading) ? "not-allowed" : "pointer",
            opacity: (viewLoading || downloadLoading) ? 0.7 : 1,
          }}
        >
          {viewLoading ? "Loading..." : "View PDF"}
        </button>

        <button
          onClick={downloadinvoslip}
          disabled={downloadLoading || viewLoading}
          style={{
            backgroundColor: "#28a745",
            color: "white",
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            cursor: (downloadLoading || viewLoading) ? "not-allowed" : "pointer",
            opacity: (downloadLoading || viewLoading) ? 0.7 : 1,
          }}
        >
          {downloadLoading ? "Downloading..." : "Download"}
        </button>
      </div>

      {/* 🔹 Inline PDF Viewer */}
      {pdfSrc && (
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
            title="invoslip PDF"
            style={{ border: "none" }}
          />
        </div>
      )}
    </div>
  );
};

export default InvoiceViewer;