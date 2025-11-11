import { numberToWords } from "./number-to-words";

export async function generatePDF(templatePath: string, data: any) {
  const content = generatePDFContent(data);
  return Buffer.from(content, "utf-8");
}

function generatePDFContent(data: any): string {
  if (data.quotationNumber) {
    return generateQuotationPDF(data);
  } else if (data.invoiceNumber) {
    return generateInvoicePDF(data);
  } else {
    return "Document content";
  }
}

function generateCompanyHeader(): string {
  return `
================================================================================
                        GLOBAL CONSULTANCY SERVICES
                            MARINE & OFFSHORE
================================================================================
016, Loha Bhavan 93, Loha Bhavan, P D'Mello Road, Carnac Bunder,
Masjid (East), Mumbai, Maharashtra, India. Pincode - 400 009

Email: admin@globalconsultancyservices.net, globalconsultancyservices@gmail.com
Web: www.globalconsultancyservices.net | Tel: +919869990250
MSME Reg. No.: UDYAM-MH-19-0015824

ISO 9001:2015 Certified by IRQS
Ship Design | Marine & Offshore Consultant | Marine Fire Protection Systems & Solutions
================================================================================
`;
}

function generateCompanyFooter(): string {
  return `
================================================================================
Payment Terms: Interest @ 21% Per annum will be charged if not paid within 30 days
                or specifically agreed in Contract.

GST No.: 27AINPA9487A1Z4                    For, GLOBAL CONSULTANCY SERVICES
HSN/SAC: 998391
PAN No.: AINPA9487A

Bank: ICICI BANK LTD.                                    Authorized Signatory
Branch & IFSC: VIKHROLI (EAST) & ICIC0001249
Account No.: 124905500046
Account Name: GLOBAL CONSULTANCY SERVICES
================================================================================
`;
}

function generateQuotationPDF(quotation: any): string {
  const header = generateCompanyHeader();
  const footer = generateCompanyFooter();

  const customerName =
    quotation.customer?.companyName ||
    `${quotation.customer?.firstName || ""} ${
      quotation.customer?.lastName || ""
    }`.trim();

  const customerAddress = quotation.customer?.billingAddress
    ? `${quotation.customer.billingAddress.addressLine1}
${quotation.customer.billingAddress.addressLine2 || ""}
${quotation.customer.billingAddress.city}, ${
        quotation.customer.billingAddress.state
      } ${quotation.customer.billingAddress.postalCode}
${quotation.customer.billingAddress.country}`
    : quotation.customer?.addressLine1
    ? `${quotation.customer.addressLine1}
${quotation.customer.addressLine2 || ""}
${quotation.customer.city}, ${quotation.customer.state} ${
        quotation.customer.postalCode
      }
${quotation.customer.country}`
    : "Address not available";

  const content = `${header}

                                **QUOTATION**
                           "ORIGINAL FOR RECIPIENT"

================================================================================
Client: ${customerName}                    Quotation No.: ${
    quotation.quotationNumber
  }
Add.: ${customerAddress.replace(
    /\n/g,
    "\n      "
  )}                           Date: ${new Date(
    quotation.date
  ).toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })}

Contact Person: ${
    quotation.customer?.firstName || "N/A"
  }     Valid Until: ${new Date(quotation.validUntil).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  )}
Email: ${quotation.customer?.email || "N/A"}
Contact No.: ${quotation.customer?.phone || "N/A"}           Client GSTIN: ${
    quotation.customer?.gstNumber || "N/A"
  }
                                                Place of Supply: ${
                                                  quotation.placeOfSupply ||
                                                  "N/A"
                                                }
================================================================================

Subject: Quotation for ${customerName}

${
  quotation.project
    ? `Project: ${quotation.project.name} (${quotation.project.projectCode})`
    : ""
}

================================================================================
Sr.No. | Description of Product/Service(s)              | Qty | Unit Price | Amount
================================================================================
${quotation.items
  .map(
    (item: any, index: number) =>
      `${(index + 1).toString().padEnd(6)} | ${item.description.padEnd(
        46
      )} | ${item.quantity.toString().padEnd(3)} | ${item.unitPrice
        .toFixed(2)
        .padStart(10)} | ${item.total.toFixed(2).padStart(10)}`
  )
  .join("\n")}
${Array.from(
  { length: Math.max(0, 10 - quotation.items.length) },
  (_, i) =>
    `${" ".repeat(6)} | ${" ".repeat(46)} | ${" ".repeat(3)} | ${" ".repeat(
      10
    )} | ${" ".repeat(10)}`
).join("\n")}
================================================================================
                                                Sub Total (Without Taxes): ${quotation.subtotal
                                                  .toFixed(2)
                                                  .padStart(10)}
                                                                      Tax: ${quotation.tax
                                                                        .toFixed(
                                                                          2
                                                                        )
                                                                        .padStart(
                                                                          10
                                                                        )}
                                                              Grand Total: ${quotation.total
                                                                .toFixed(2)
                                                                .padStart(10)}
================================================================================

Amount in Words: ${numberToWords(quotation.total)}

Terms and Conditions:
${quotation.termsAndConditions || "Standard terms and conditions apply."}

${quotation.notes ? `\nNotes:\n${quotation.notes}` : ""}

${footer}`;

  return content;
}

function generateInvoicePDF(invoice: any): string {
  const header = generateCompanyHeader();
  const footer = generateCompanyFooter();

  const customerName =
    invoice.customer?.companyName ||
    `${invoice.customer?.firstName || ""} ${
      invoice.customer?.lastName || ""
    }`.trim();

  const customerAddress = invoice.customer?.billingAddress
    ? `${invoice.customer.billingAddress.addressLine1}
${invoice.customer.billingAddress.addressLine2 || ""}
${invoice.customer.billingAddress.city}, ${
        invoice.customer.billingAddress.state
      } ${invoice.customer.billingAddress.postalCode}
${invoice.customer.billingAddress.country}`
    : "Address not available";

  const content = `${header}

                                **TAX INVOICE**
                           "ORIGINAL FOR RECIPIENT"

================================================================================
Client: ${customerName}                      Invoice No.: ${
    invoice.invoiceNumber
  }
Add.: ${customerAddress.replace(
    /\n/g,
    "\n      "
  )}                             Date: ${new Date(
    invoice.date || invoice.invoiceDate
  ).toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })}

Contact Person: ${
    invoice.contactPerson || invoice.customer?.firstName || "N/A"
  }       Due Date: ${new Date(invoice.dueDate).toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })}
Email: ${invoice.customer?.email || "N/A"}                   Client GSTIN: ${
    invoice.customer?.gstNumber || "N/A"
  }
Contact No.: ${invoice.customer?.phone || "N/A"}             Place of Supply: ${
    invoice.placeOfSupply || "N/A"
  }

Our Ref.: ${invoice.ourReference || "N/A"}                   P.O. No.: ${
    invoice.poNumber || "N/A"
  }
${invoice.vesselName ? `Vessel Name: ${invoice.vesselName}` : ""}
================================================================================

${
  invoice.project
    ? `Project: ${invoice.project.name} (${invoice.project.projectCode})`
    : ""
}

================================================================================
Sr.No. | Description of Product/Service(s)              | Qty | Unit Price | Tax% | Amount
================================================================================
${invoice.items
  .map(
    (item: any, index: number) =>
      `${(index + 1).toString().padEnd(6)} | ${item.description.padEnd(
        46
      )} | ${item.quantity.toString().padEnd(3)} | ${item.unitPrice
        .toFixed(2)
        .padStart(10)} | ${(item.taxRate || 0).toString().padEnd(4)} | ${(
        item.total || item.amount
      )
        .toFixed(2)
        .padStart(10)}`
  )
  .join("\n")}
${Array.from(
  { length: Math.max(0, 10 - invoice.items.length) },
  (_, i) =>
    `${" ".repeat(6)} | ${" ".repeat(46)} | ${" ".repeat(3)} | ${" ".repeat(
      10
    )} | ${" ".repeat(4)} | ${" ".repeat(10)}`
).join("\n")}
================================================================================
                                                Sub Total (Without Taxes): ${invoice.subtotal
                                                  .toFixed(2)
                                                  .padStart(10)}
                                                            ADD. CGST @ 9%: ${(
                                                              invoice.cgst || 0
                                                            )
                                                              .toFixed(2)
                                                              .padStart(10)}
                                                            ADD. SGST @ 9%: ${(
                                                              invoice.sgst || 0
                                                            )
                                                              .toFixed(2)
                                                              .padStart(10)}
                                                           ADD. IGST @ 18%: ${(
                                                             invoice.igst || 0
                                                           )
                                                             .toFixed(2)
                                                             .padStart(10)}
                                                    Grand Total (Incl. Taxes): ${invoice.total
                                                      .toFixed(2)
                                                      .padStart(10)}
================================================================================

Amount in Words: ${numberToWords(invoice.total)}

${invoice.notes ? `\nNotes:\n${invoice.notes}` : ""}

${
  invoice.termsAndConditions
    ? `\nTerms and Conditions:\n${invoice.termsAndConditions}`
    : ""
}

${footer}`;

  return content;
}

export async function generateExcel(data: any) {
  const headers = Object.keys(data[0] || {});
  const csvContent = [
    headers.join(","),
    ...data.map((item: any) => headers.map((header) => item[header]).join(",")),
  ].join("\n");

  return Buffer.from(csvContent, "utf-8");
}

export async function parseExcel(buffer: Buffer) {
  const content = buffer.toString("utf-8");
  const lines = content.split("\n");
  const headers = lines[0].split(",");

  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = values[index];
    });
    return obj;
  });
}
