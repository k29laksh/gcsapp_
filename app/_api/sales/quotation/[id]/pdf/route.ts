import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { numberToWords } from "@/lib/number-to-words";

// Mark as dynamic to ensure it's not statically optimized
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("PDF generation started");
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    console.log(`Generating PDF for quotation ID: ${id}`);

    // Fetch quotation data
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            billingAddress: true,
          },
        },
        project: true,
        items: true,
      },
    });

    if (!quotation) {
      console.log("Quotation not found");
      return new NextResponse("Quotation not found", { status: 404 });
    }

    // Fetch company profile
    const companyProfile = await prisma.companyProfile.findFirst();
    console.log("Company profile fetched");

    // Generate HTML content for client-side rendering
    const htmlContent = generateQuotationHTML(quotation, companyProfile);

    // Return HTML that will be rendered on the client side and converted to PDF there
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return new NextResponse(`PDF Generation Error: ${error.message}`, {
      status: 500,
    });
  }
}

function generateQuotationHTML(quotation: any, companyProfile: any) {
  const customerName =
    quotation.customer?.companyName ||
    `${quotation.customer?.firstName || ""} ${
      quotation.customer?.lastName || ""
    }`.trim();

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace("₹", "")
      .trim();
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate amount in words
  const amountInWords = numberToWords(quotation.total);

  // Serialize the quotation data for client-side use
  const quotationData = JSON.stringify({
    id: quotation.id,
    quotationNumber: quotation.quotationNumber,
    customerName,
    date: quotation.date,
    validUntil: quotation.validUntil,
    items: quotation.items,
    subtotal: quotation.subtotal,
    tax: quotation.tax,
    total: quotation.total,
    termsAndConditions: quotation.termsAndConditions,
    placeOfSupply: quotation.placeOfSupply,
    customer: {
      billingAddress: quotation.customer?.billingAddress,
      gstNumber: quotation.customer?.gstNumber,
    },
    amountInWords,
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Quotation ${quotation.quotationNumber}</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
      <style>
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          margin: 0;
          padding: 20px;
          color: #000;
        }
        #pdf-content {
          background: white;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 10mm;
          box-sizing: border-box;
          position: relative;
        }
        .page-number {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 72px;
          color: rgba(128, 128, 128, 0.2);
          z-index: 0;
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
        .quotation-title {
          text-align: center;
          margin: 20px 0;
          position: relative;
          z-index: 1;
        }
        .quotation-title h1 {
          font-size: 18px;
          margin: 0;
        }
        .quotation-title p {
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
        .client-info, .quotation-info {
          width: 48%;
        }
        .client-info h3, .quotation-info h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
        }
        .subject {
          margin-bottom: 20px;
          position: relative;
          z-index: 1;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          position: relative;
          z-index: 1;
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
        .amount-in-words {
          border: 1px solid #000;
          padding: 8px;
          margin-bottom: 20px;
        }
        .payment-terms {
          border: 1px solid #000;
          padding: 8px;
          margin-bottom: 20px;
        }
        .company-details-table {
          margin-bottom: 20px;
        }
        .company-details-table td {
          padding: 5px;
        }
        .signature {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
        }
        .signature-line {
          width: 200px;
          border-top: 1px solid #000;
          margin-top: 40px;
          text-align: center;
        }
        .controls {
          position: fixed;
          top: 20px;
          right: 20px;
          background: white;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 5px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          z-index: 1000;
        }
        .controls button {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 8px 15px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          margin-right: 5px;
        }
        .controls button:hover {
          background: #45a049;
        }
        @media print {
          body { margin: 0; }
          .controls { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="controls">
        <button onclick="generatePDF()">Download PDF</button>
        <button onclick="window.print()">Print</button>
      </div>
      
      <div id="pdf-content">
        <div class="page-number">Page 1</div>
        
        <div class="header">
          <div class="company-name">GLOBAL CONSULTANCY SERVICES</div>
          <div class="company-subtitle">MARINE & OFFSHORE</div>
          <div class="company-details">
            <p>016, Loha Bhavan 93, Loha Bhavan, P D'Mello Road, Carnac Bunder,</p>
            <p>Masjid (East), Mumbai, Maharashtra, India. Pincode - 400 009</p>
            <p>Email: admin@globalconsultancyservices.net | Tel: +919869990250</p>
            <p>MSME Reg. No.: UDYAM-MH-19-0015824</p>
            <p>ISO 9001:2015 Certified by IRQS</p>
          </div>
        </div>

        <div class="quotation-title">
          <h1>QUOTATION</h1>
          <p>"ORIGINAL FOR RECIPIENT"</p>
        </div>

        <div id="quotation-details"></div>
      </div>

      <script>
        // Parse the quotation data
        const quotationData = ${quotationData};
        
        function renderQuotation() {
          const quotationDetails = document.getElementById('quotation-details');
          
          // Format dates
          const formatDate = (dateString) => {
            return new Date(dateString).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          };
          
          // Client and quotation info section
          let html = \`
            <div class="info-section">
              <div class="client-info">
                <h3>Client:</h3>
                <p><strong>\${quotationData.customerName}</strong></p>
          \`;
          
          if (quotationData.customer?.billingAddress) {
            html += \`
              <p>\${quotationData.customer.billingAddress.addressLine1}</p>
              \${quotationData.customer.billingAddress.addressLine2 ? \`<p>\${quotationData.customer.billingAddress.addressLine2}</p>\` : ""}
              <p>\${quotationData.customer.billingAddress.city}, \${quotationData.customer.billingAddress.state} \${quotationData.customer.billingAddress.postalCode}</p>
              <p>\${quotationData.customer.billingAddress.country}</p>
            \`;
          }
          
          if (quotationData.customer?.gstNumber) {
            html += \`<p>GST No: \${quotationData.customer.gstNumber}</p>\`;
          }
          
          html += \`
              </div>
              <div class="quotation-info">
                <p><strong>Quotation No.:</strong> \${quotationData.quotationNumber}</p>
                <p><strong>Date:</strong> \${formatDate(quotationData.date)}</p>
                <p><strong>Valid Until:</strong> \${formatDate(quotationData.validUntil)}</p>
                \${quotationData.placeOfSupply ? \`<p><strong>Place of Supply:</strong> \${quotationData.placeOfSupply}</p>\` : ""}
              </div>
            </div>

            <div class="subject">
              <p><strong>Subject:</strong> Quotation for \${quotationData.customerName}</p>
            </div>
          \`;
          
          // Items table
          html += \`
            <table>
              <thead>
                <tr>
                  <th class="text-center" style="width: 5%;">Sr. No.</th>
                  <th style="width: 45%;">Description</th>
                  <th class="text-center" style="width: 10%;">Qty</th>
                  <th class="text-center" style="width: 15%;">Unit Price (₹)</th>
                  <th class="text-center" style="width: 10%;">Tax (%)</th>
                  <th class="text-right" style="width: 15%;">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
          \`;
          
          // Add items
          if (quotationData.items && quotationData.items.length > 0) {
            quotationData.items.forEach((item, index) => {
              html += \`
                <tr>
                  <td class="text-center">\${index + 1}</td>
                  <td>\${item.description}</td>
                  <td class="text-center">\${item.quantity}</td>
                  <td class="text-right">\${parseFloat(item.unitPrice || 0).toFixed(2)}</td>
                  <td class="text-center">\${parseFloat(item.tax || 0)}%</td>
                  <td class="text-right">\${parseFloat(item.total || 0).toFixed(2)}</td>
                </tr>
              \`;
            });
          }
          
          // Add empty rows if needed
          const emptyRowsCount = Math.max(0, 5 - (quotationData.items?.length || 0));
          for (let i = 0; i < emptyRowsCount; i++) {
            html += \`
              <tr>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            \`;
          }
          
          html += \`
              </tbody>
            </table>
          \`;
          
          // Totals section
          html += \`
            <table class="totals-table">
              <tr>
                <td>Sub Total (Without Taxes)</td>
                <td class="text-right">₹ \${parseFloat(quotationData.subtotal || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>ADD. CGST @ 9%</td>
                <td class="text-right">N.A.</td>
              </tr>
              <tr>
                <td>ADD. SGST @ 9%</td>
                <td class="text-right">N.A.</td>
              </tr>
              <tr>
                <td>ADD. IGST @ 18%</td>
                <td class="text-right">N.A.</td>
              </tr>
              <tr>
                <td><strong>Grand Total (Incl. Taxes)</strong></td>
                <td class="text-right"><strong>₹ \${parseFloat(quotationData.total || 0).toFixed(2)}</strong></td>
              </tr>
            </table>
          \`;
          
          // Amount in words
          html += \`
            <table>
              <tr>
                <td style="width: 20%;"><strong>Amount in Words :</strong></td>
                <td>\${quotationData.amountInWords}</td>
              </tr>
            </table>
          \`;
          
          // Payment terms
          html += \`
            <table>
              <tr>
                <td style="width: 20%;"><strong>Payment Terms :</strong></td>
                <td>Interest @ 21% Per annum will be charged if not paid within 30 days or specifically agreed in Contract.</td>
              </tr>
            </table>
          \`;
          
          // Company details
          html += \`
            <table>
              <tr>
                <td style="width: 20%;"><strong>GST No. :</strong></td>
                <td style="width: 30%;">27AINPA9487A1Z4</td>
                <td style="width: 50%; text-align: right;"><strong>For, GLOBAL CONSULTANCY SERVICES</strong></td>
              </tr>
              <tr>
                <td><strong>HSN/SAC :</strong></td>
                <td>998391</td>
                <td rowspan="6"></td>
              </tr>
              <tr>
                <td><strong>PAN No. :</strong></td>
                <td>AINPA9487A</td>
              </tr>
              <tr>
                <td><strong>Bank :</strong></td>
                <td>ICICI BANK LTD.</td>
              </tr>
              <tr>
                <td><strong>Branch & IFSC :</strong></td>
                <td>VIKHROLI (EAST) & ICIC0001249</td>
              </tr>
              <tr>
                <td><strong>Account No. :</strong></td>
                <td>124905500046</td>
              </tr>
              <tr>
                <td><strong>Account Name :</strong></td>
                <td>GLOBAL CONSULTANCY SERVICES</td>
                <td style="text-align: right; vertical-align: bottom;"><strong>Authorized Signatory</strong></td>
              </tr>
            </table>
          \`;
          
          // Terms and conditions
          if (quotationData.termsAndConditions) {
            html += \`
              <div class="terms" style="margin-top: 20px;">
                <h3>Terms and Conditions:</h3>
                <div style="white-space: pre-wrap;">\${quotationData.termsAndConditions}</div>
              </div>
            \`;
          }
          
          quotationDetails.innerHTML = html;
        }
        
        // Generate PDF using html2canvas and jsPDF
        async function generatePDF() {
          try {
            // Check if required libraries are loaded
            if (!window.jspdf || !window.html2canvas) {
              throw new Error('Required PDF generation libraries not loaded. Please refresh the page.');
            }

            const { jsPDF } = window.jspdf;
            const element = document.getElementById('pdf-content');
            
            // Show loading indicator
            const loadingDiv = document.createElement('div');
            loadingDiv.style.position = 'fixed';
            loadingDiv.style.top = '0';
            loadingDiv.style.left = '0';
            loadingDiv.style.width = '100%';
            loadingDiv.style.height = '100%';
            loadingDiv.style.backgroundColor = 'rgba(255,255,255,0.8)';
            loadingDiv.style.display = 'flex';
            loadingDiv.style.justifyContent = 'center';
            loadingDiv.style.alignItems = 'center';
            loadingDiv.style.zIndex = '9999';
            loadingDiv.innerHTML = '<h2>Generating PDF...</h2>';
            document.body.appendChild(loadingDiv);

            // Hide watermark temporarily for better PDF generation
            const watermarks = document.getElementsByClassName('page-number');
            for (let watermark of watermarks) {
              watermark.style.display = 'none';
            }
            
            try {
              const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                allowTaint: true,
                backgroundColor: '#ffffff',
                imageTimeout: 15000,
                removeContainer: true,
                foreignObjectRendering: true
              });
              
              const imgData = canvas.toDataURL('image/jpeg', 1.0);
              
              // Calculate dimensions based on A4 size
              const pdf = new jsPDF('p', 'mm', 'a4');
              const imgWidth = 210; // A4 width in mm
              const pageHeight = 297; // A4 height in mm
              const imgHeight = canvas.height * imgWidth / canvas.width;
              
              let heightLeft = imgHeight;
              let position = 0;
              let page = 1;
              
              // Add first page
              pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
              
              // Add subsequent pages if needed
              while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
                page++;
              }
              
              // Save the PDF
              pdf.save(\`quotation-\${quotationData.quotationNumber}.pdf\`);
            } catch (error) {
              console.error('Error generating PDF:', error);
              alert('Failed to generate PDF. Please try again or contact support.');
            } finally {
              // Restore watermark visibility
              for (let watermark of watermarks) {
                watermark.style.display = 'block';
              }
              
              // Remove loading indicator
              document.body.removeChild(loadingDiv);
            }
          } catch (error) {
            console.error('PDF generation failed:', error);
            alert(error.message || 'Failed to generate PDF. Please try again or contact support.');
          }
        }
        
        // Ensure libraries are loaded before allowing PDF generation
        function checkLibrariesLoaded() {
          return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
              if (window.jspdf && window.html2canvas) {
                clearInterval(checkInterval);
                resolve(true);
              }
            }, 100);
            
            // Timeout after 10 seconds
            setTimeout(() => {
              clearInterval(checkInterval);
              resolve(false);
            }, 10000);
          });
        }
        
        // Initialize the page
        async function init() {
          renderQuotation();
          const librariesLoaded = await checkLibrariesLoaded();
          const downloadButton = document.querySelector('.controls button');
          
          if (!librariesLoaded) {
            downloadButton.disabled = true;
            downloadButton.style.backgroundColor = '#ccc';
            downloadButton.title = 'PDF generation libraries not loaded';
            console.error('PDF generation libraries failed to load');
          }
        }
        
        // Start initialization when the page loads
        window.onload = init;
      </script>
    </body>
    </html>
  `;
}
