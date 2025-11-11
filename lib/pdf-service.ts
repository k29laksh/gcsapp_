import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

export async function generatePDF(htmlContent: string): Promise<Buffer> {
  let browser = null;

  try {
    console.log("PDF generation started");

    // Configure Puppeteer for serverless environment
    let executablePath;
    try {
      executablePath = await chromium.executablePath();
      console.log(`Chrome executable path: ${executablePath}`);
    } catch (error) {
      console.error("Error getting Chromium path:", error);
      // Fallback to using the installed Chrome on the system
      executablePath =
        process.env.CHROME_PATH ||
        (process.platform === "win32"
          ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
          : "/usr/bin/google-chrome");
      console.log(`Using fallback Chrome path: ${executablePath}`);
    }

    // Launch browser with serverless configuration
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--single-process",
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    });

    console.log("Browser launched");
    const page = await browser.newPage();
    console.log("New page created");

    // Set content with extended timeout
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    console.log("Content set to page");

    // Generate PDF with error handling and extended timeout
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
      preferCSSPageSize: true,
      timeout: 60000,
    });
    console.log("PDF generated successfully");

    await browser.close();
    console.log("Browser closed");

    return pdf;
  } catch (error) {
    console.error("Error generating PDF:", error);

    // Always close the browser on error
    if (browser) {
      try {
        await browser.close();
        console.log("Browser closed after error");
      } catch (closeError) {
        console.error("Error closing browser:", closeError);
      }
    }

    throw error;
  }
}
