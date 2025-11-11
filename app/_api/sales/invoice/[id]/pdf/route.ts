import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { numberToWords } from "@/lib/number-to-words";

// Mark as dynamic to ensure it's not statically optimized
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Invoice PDF generation started");
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const id = params.id;
    console.log(`Generating PDF for invoice ID: ${id}`);

    // Get the invoice with customer details
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            billingAddress: true,
          },
        },
        project: true,
        items: true,
        payments: true,
      },
    });

    if (!invoice) {
      console.log("Invoice not found");
      return new NextResponse("Invoice not found", { status: 404 });
    }

    // Get company profile
    const companyProfile = await prisma.companyProfile.findFirst();
    console.log("Company profile fetched");

    // Generate HTML content for client-side rendering
    const htmlContent = generateInvoiceHTML(invoice, companyProfile);

    // Return HTML that will be rendered on the client side and converted to PDF there
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    return new NextResponse(`PDF Generation Error: ${error.message}`, {
      status: 500,
    });
  }
}

function generateInvoiceHTML(invoice: any, companyProfile: any) {
  const customerName =
    invoice.customer?.companyName ||
    `${invoice.customer?.firstName || ""} ${
      invoice.customer?.lastName || ""
    }`.trim() ||
    "Customer";

  // Calculate amount in words
  const amountInWords = numberToWords(invoice.total || 0);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${invoice.invoiceNumber}</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
      <style>
        * {
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          margin: 0;
          padding: 20px;
          color: #000;
          background-color: #f5f5f5;
        }
        
        #pdf-content {
          background: white;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 10mm;
          box-sizing: border-box;
          position: relative;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        .page-number {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 72px;
          color: rgba(128, 128, 128, 0.2);
          z-index: 0;
          pointer-events: none;
        }
        
        .header {
          text-align: center;
          border-bottom: 1px solid #000;
          padding-bottom: 10px;
          margin-bottom: 20px;
          position: relative;
          z-index: 1;
        }
        
        .company-name {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .company-subtitle {
          font-size: 16px;
          margin-bottom: 10px;
        }
        
        .company-details {
          font-size: 10px;
          line-height: 1.3;
        }
        
        .invoice-title {
          text-align: center;
          margin: 20px 0;
          position: relative;
          z-index: 1;
        }
        
        .invoice-title h1 {
          font-size: 18px;
          margin: 0;
        }
        
        .invoice-title p {
          font-size: 12px;
          margin: 5px 0 0 0;
        }
        
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          border: 1px solid #000;
          padding: 10px;
          position: relative;
          z-index: 1;
        }
        
        .client-info, .invoice-info {
          width: 48%;
        }
        
        .client-info h3, .invoice-info h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          position: relative;
          z-index: 1;
          margin-bottom: 20px;
        }
        
        th, td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
        }
        
        th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        
        .text-right {
          text-align: right;
        }
        
        .text-center {
          text-align: center;
        }
        
        .totals-table {
          margin-left: auto;
          width: 50%;
          margin-bottom: 20px;
        }
        
        .totals-table td {
          padding: 5px;
        }
        
        .controls {
          position: fixed;
          top: 20px;
          right: 20px;
          background: white;
          padding: 15px;
          border: 1px solid #ccc;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 1000;
          display: flex;
          gap: 10px;
        }
        
        .controls button {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
          font-size: 14px;
          transition: background-color 0.2s;
        }
        
        .controls button:hover {
          background: #0056b3;
        }
        
        .controls button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
        
        .loading {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255,255,255,0.9);
          display: none;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          font-size: 18px;
          font-weight: bold;
        }
        
        @media print {
          body { 
            margin: 0; 
            background: white;
          }
          .controls { 
            display: none; 
          }
          #pdf-content {
            box-shadow: none;
            margin: 0;
          }
        }
        
        @media screen and (max-width: 768px) {
          body {
            padding: 10px;
          }
          
          #pdf-content {
            width: 100%;
            min-width: auto;
          }
          
          .controls {
            position: relative;
            top: auto;
            right: auto;
            margin-bottom: 20px;
            justify-content: center;
          }
          
          .info-section {
            flex-direction: column;
          }
          
          .client-info, .invoice-info {
            width: 100%;
            margin-bottom: 10px;
          }
        }
      </style>
    </head>
    <body>
      <div class="loading" id="loading">
        <div>Generating PDF...</div>
      </div>
      
      <div class="controls">
        <button onclick="generatePDF()" id="downloadBtn">Download PDF</button>
        <button onclick="window.print()" id="printBtn">Print</button>
      </div>
      
      <div id="pdf-content">
        <div class="page-number">Page 1</div>
        
        <div class="header">
          <div class="company-name">${
            companyProfile?.companyName || "GLOBAL CONSULTANCY SERVICES"
          }</div>
          <div class="company-subtitle">MARINE & OFFSHORE</div>
          <div class="company-details">
            <p>${
              companyProfile?.address ||
              "016, Loha Bhavan 93, Loha Bhavan, P D'Mello Road, Carnac Bunder,"
            }</p>
            <p>Masjid (East), ${companyProfile?.city || "Mumbai"}, ${
    companyProfile?.state || "Maharashtra"
  }, ${companyProfile?.country || "India"}. Pincode - ${
    companyProfile?.zipCode || "400 009"
  }</p>
            <p>Email: ${
              companyProfile?.email || "admin@globalconsultancyservices.net"
            } | Tel: ${companyProfile?.phone || "+919869990250"}</p>
            <p>MSME Reg. No.: ${
              companyProfile?.msmeNumber || "UDYAM-MH-19-0015824"
            }</p>
            <p>ISO 9001:2015 Certified by IRQS</p>
          </div>
        </div>

        <div class="invoice-title">
          <h1>TAX INVOICE</h1>
          <p>"ORIGINAL FOR RECIPIENT"</p>
        </div>

        <div class="info-section">
          <div class="client-info">
            <h3>Bill To:</h3>
            <p><strong>${customerName}</strong></p>
            ${
              invoice.contactPerson
                ? `<p><strong>Contact:</strong> ${invoice.contactPerson}</p>`
                : ""
            }
            ${
              invoice.customer?.billingAddress
                ? `
                <p>${invoice.customer.billingAddress.addressLine1 || ""}</p>
                ${
                  invoice.customer.billingAddress.addressLine2
                    ? `<p>${invoice.customer.billingAddress.addressLine2}</p>`
                    : ""
                }
                <p>${invoice.customer.billingAddress.city || ""}, ${
                    invoice.customer.billingAddress.state || ""
                  } ${invoice.customer.billingAddress.postalCode || ""}</p>
                <p>${invoice.customer.billingAddress.country || ""}</p>
              `
                : ""
            }
            ${
              invoice.customer?.gstNumber
                ? `<p>GST No: ${invoice.customer.gstNumber}</p>`
                : ""
            }
          </div>
          <div class="invoice-info">
            <p><strong>Invoice No.:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Date:</strong> ${new Date(
              invoice.date || invoice.invoiceDate
            ).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</p>
            <p><strong>Due Date:</strong> ${new Date(
              invoice.dueDate
            ).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</p>
            ${
              invoice.poNumber
                ? `<p><strong>PO Number:</strong> ${invoice.poNumber}</p>`
                : ""
            }
            ${
              invoice.vesselName
                ? `<p><strong>Vessel:</strong> ${invoice.vesselName}</p>`
                : ""
            }
            ${
              invoice.placeOfSupply
                ? `<p><strong>Place of Supply:</strong> ${invoice.placeOfSupply}</p>`
                : ""
            }
            ${
              invoice.ourReference
                ? `<p><strong>Our Reference:</strong> ${invoice.ourReference}</p>`
                : ""
            }
          </div>
        </div>

        ${
          invoice.project
            ? `
        <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #ccc; background-color: #f9f9f9;">
          <p><strong>Project:</strong> ${invoice.project.name} ${
                invoice.project.projectCode
                  ? `(${invoice.project.projectCode})`
                  : ""
              }</p>
        </div>
        `
            : ""
        }

        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 5%;">Sr. No.</th>
              <th style="width: 40%;">Description</th>
              <th class="text-center" style="width: 10%;">HSN/SAC</th>
              <th class="text-center" style="width: 10%;">Qty</th>
              <th class="text-right" style="width: 15%;">Unit Price (₹)</th>
              <th class="text-center" style="width: 5%;">Tax %</th>
              <th class="text-right" style="width: 15%;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${
              invoice.items
                ?.map(
                  (item: any, index: number) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>${item.description || ""}</td>
                <td class="text-center">${
                  item.hsn || item.sacCode || "998391"
                }</td>
                <td class="text-center">${item.quantity || 0}</td>
                <td class="text-right">${Number(item.unitPrice || 0).toFixed(
                  2
                )}</td>
                <td class="text-center">${Number(item.taxRate || 18)}%</td>
                <td class="text-right">${Number(
                  item.total || item.amount || 0
                ).toFixed(2)}</td>
              </tr>
            `
                )
                .join("") || ""
            }
            ${Array(Math.max(0, 8 - (invoice.items?.length || 0)))
              .fill(0)
              .map(
                () => `
              <tr>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <table class="totals-table">
          <tr>
            <td>Sub Total (Without Taxes)</td>
            <td class="text-right">₹ ${Number(invoice.subtotal || 0).toFixed(
              2
            )}</td>
          </tr>
          ${
            invoice.discountAmount > 0
              ? `
          <tr>
            <td>Discount</td>
            <td class="text-right">- ₹ ${Number(
              invoice.discountAmount || 0
            ).toFixed(2)}</td>
          </tr>
          `
              : ""
          }
          ${
            invoice.shippingAmount > 0
              ? `
          <tr>
            <td>Shipping</td>
            <td class="text-right">₹ ${Number(
              invoice.shippingAmount || 0
            ).toFixed(2)}</td>
          </tr>
          `
              : ""
          }
          ${
            invoice.adjustmentAmount !== 0
              ? `
          <tr>
            <td>${invoice.adjustmentLabel || "Adjustment"}</td>
            <td class="text-right">${
              invoice.adjustmentAmount > 0 ? "₹" : "- ₹"
            } ${Math.abs(Number(invoice.adjustmentAmount || 0)).toFixed(2)}</td>
          </tr>
          `
              : ""
          }
          <tr>
            <td>ADD. CGST @ 9%</td>
            <td class="text-right">${
              Number(invoice.cgst || 0) > 0
                ? `₹ ${Number(invoice.cgst || 0).toFixed(2)}`
                : "N.A."
            }</td>
          </tr>
          <tr>
            <td>ADD. SGST @ 9%</td>
            <td class="text-right">${
              Number(invoice.sgst || 0) > 0
                ? `₹ ${Number(invoice.sgst || 0).toFixed(2)}`
                : "N.A."
            }</td>
          </tr>
          <tr>
            <td>ADD. IGST @ 18%</td>
            <td class="text-right">${
              Number(invoice.igst || 0) > 0
                ? `₹ ${Number(invoice.igst || 0).toFixed(2)}`
                : "N.A."
            }</td>
          </tr>
          <tr>
            <td><strong>Grand Total (Incl. Taxes)</strong></td>
            <td class="text-right"><strong>₹ ${Number(
              invoice.total || 0
            ).toFixed(2)}</strong></td>
          </tr>
        </table>

        <table>
          <tr>
            <td style="width: 20%;"><strong>Amount in Words :</strong></td>
            <td>${amountInWords}</td>
          </tr>
        </table>

        <table>
          <tr>
            <td style="width: 20%;"><strong>Payment Terms :</strong></td>
            <td>Interest @ 21% Per annum will be charged if not paid within 30 days or specifically agreed in Contract.</td>
          </tr>
        </table>

        <table>
          <tr>
            <td style="width: 20%;"><strong>GST No. :</strong></td>
            <td style="width: 30%;">${
              companyProfile?.gstNumber || "27AINPA9487A1Z4"
            }</td>
            <td style="width: 50%; text-align: right;"><strong>For, ${
              companyProfile?.companyName || "GLOBAL CONSULTANCY SERVICES"
            }</strong></td>
          </tr>
          <tr>
            <td><strong>HSN/SAC :</strong></td>
            <td>${companyProfile?.hsnSacCode || "998391"}</td>
            <td rowspan="6" style="text-align: center; vertical-align: middle;">
              <div style="height: 80px; display: flex; align-items: flex-end; justify-content: center;">
                <strong>Authorized Signatory</strong>
              </div>
            </td>
          </tr>
          <tr>
            <td><strong>PAN No. :</strong></td>
            <td>${companyProfile?.panNumber || "AINPA9487A"}</td>
          </tr>
          <tr>
            <td><strong>Bank :</strong></td>
            <td>${companyProfile?.bankName || "ICICI BANK LTD."}</td>
          </tr>
          <tr>
            <td><strong>Branch & IFSC :</strong></td>
            <td>${companyProfile?.bankBranch || "VIKHROLI (EAST)"} & ${
    companyProfile?.bankIfscCode || "ICIC0001249"
  }</td>
          </tr>
          <tr>
            <td><strong>Account No. :</strong></td>
            <td>${companyProfile?.bankAccountNumber || "124905500046"}</td>
          </tr>
          <tr>
            <td><strong>Account Name :</strong></td>
            <td>${
              companyProfile?.companyName || "GLOBAL CONSULTANCY SERVICES"
            }</td>
          </tr>
        </table>

        ${
          invoice.notes
            ? `
          <div style="margin-top: 20px;">
            <h3>Notes:</h3>
            <p>${invoice.notes}</p>
          </div>
        `
            : ""
        }

        ${
          invoice.termsAndConditions
            ? `
          <div style="margin-top: 20px;">
            <h3>Terms and Conditions:</h3>
            <div style="white-space: pre-wrap;">${invoice.termsAndConditions}</div>
          </div>
        `
            : ""
        }
      </div>

      <script>
        // Generate PDF using html2canvas and jsPDF
        function generatePDF() {
          try {
            // Check if libraries are loaded
            if (typeof window.jspdf === 'undefined' || typeof html2canvas === 'undefined') {
              alert('PDF libraries are still loading. Please wait a moment and try again.');
              return;
            }

            const { jsPDF } = window.jspdf;
            const element = document.getElementById('pdf-content');
            const downloadBtn = document.getElementById('downloadBtn');
            const printBtn = document.getElementById('printBtn');
            const loading = document.getElementById('loading');
            
            // Disable buttons and show loading
            downloadBtn.disabled = true;
            printBtn.disabled = true;
            downloadBtn.textContent = 'Generating...';
            loading.style.display = 'flex';
            
            // Generate canvas from HTML
            html2canvas(element, {
              scale: 2,
              useCORS: true,
              logging: false,
              allowTaint: true,
              backgroundColor: '#ffffff',
              width: element.scrollWidth,
              height: element.scrollHeight
            }).then(canvas => {
              try {
                const imgData = canvas.toDataURL('image/png');
                
                // Calculate dimensions for A4
                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgWidth = 210; // A4 width in mm
                const pageHeight = 297; // A4 height in mm
                const imgHeight = canvas.height * imgWidth / canvas.width;
                
                let heightLeft = imgHeight;
                let position = 0;
                
                // Add first page
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
                
                // Add additional pages if needed
                while (heightLeft > 0) {
                  position = heightLeft - imgHeight;
                  pdf.addPage();
                  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                  heightLeft -= pageHeight;
                }
                
                // Save the PDF
                pdf.save('invoice-${invoice.invoiceNumber || "download"}.pdf');
                
                // Reset buttons
                downloadBtn.disabled = false;
                printBtn.disabled = false;
                downloadBtn.textContent = 'Download PDF';
                loading.style.display = 'none';
                
              } catch (pdfError) {
                console.error('PDF generation error:', pdfError);
                alert('Error generating PDF. Please try again.');
                
                // Reset buttons
                downloadBtn.disabled = false;
                printBtn.disabled = false;
                downloadBtn.textContent = 'Download PDF';
                loading.style.display = 'none';
              }
            }).catch(canvasError => {
              console.error('Canvas generation error:', canvasError);
              alert('Error generating PDF. Please try again.');
              
              // Reset buttons
              downloadBtn.disabled = false;
              printBtn.disabled = false;
              downloadBtn.textContent = 'Download PDF';
              loading.style.display = 'none';
            });
            
          } catch (error) {
            console.error('PDF generation error:', error);
            alert('Error generating PDF. Please try again.');
          }
        }
        
        // Wait for libraries to load
        window.addEventListener('load', function() {
          console.log('Invoice PDF page loaded successfully');
          
          // Check if libraries loaded
          if (typeof window.jspdf === 'undefined') {
            console.error('jsPDF library failed to load');
          }
          if (typeof html2canvas === 'undefined') {
            console.error('html2canvas library failed to load');
          }
        });
      </script>
    </body>
    </html>
  `;
}
