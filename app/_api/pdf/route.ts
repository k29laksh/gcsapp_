import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Mark as dynamic to ensure it's not statically optimized
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    console.log("PDF generation started");
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await req.json();
    const { template, content, filename } = data;

    console.log(`Generating PDF for template: ${template}`);

    // Generate HTML content for client-side rendering
    const htmlContent = generateClientSidePDF(content, template, filename);

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

function generateClientSidePDF(
  content: any,
  template: string,
  filename: string
): string {
  // Serialize the content data for client-side use
  const contentData = JSON.stringify(content);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${filename || "Generated Document"}</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        #pdf-content {
          background: white;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 20mm;
          box-sizing: border-box;
        }
        h1 {
          color: #2563eb;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        table, th, td {
          border: 1px solid #e5e7eb;
        }
        th, td {
          padding: 10px;
          text-align: left;
        }
        th {
          background-color: #f9fafb;
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
      </div>
      
      <div id="pdf-content">
        <div id="document-content"></div>
      </div>

      <script>
        // Parse the content data
        const contentData = ${contentData};
        const templateName = "${template}";
        const fileName = "${filename || "document.pdf"}";
        
        function renderContent() {
          const documentContent = document.getElementById('document-content');
          documentContent.innerHTML = contentData;
        }
        
        // Generate PDF using html2canvas and jsPDF
        function generatePDF() {
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
          
          // Use setTimeout to allow the loading indicator to render
          setTimeout(() => {
            html2canvas(element, {
              scale: 2, // Higher scale for better quality
              useCORS: true,
              logging: false,
              allowTaint: true
            }).then(canvas => {
              const imgData = canvas.toDataURL('image/png');
              
              // Calculate dimensions based on A4 size
              const pdf = new jsPDF('p', 'mm', 'a4');
              const imgWidth = 210; // A4 width in mm
              const pageHeight = 297; // A4 height in mm
              const imgHeight = canvas.height * imgWidth / canvas.width;
              
              let heightLeft = imgHeight;
              let position = 0;
              let page = 1;
              
              // Add first page
              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
              
              // Add subsequent pages if needed
              while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
                page++;
              }
              
              // Save the PDF
              pdf.save(fileName);
              
              // Remove loading indicator
              document.body.removeChild(loadingDiv);
            });
          }, 100);
        }
        
        // Render the content when the page loads
        window.onload = renderContent;
      </script>
    </body>
    </html>
  `;
}
