import html2pdf from "html2pdf.js";
import { Invoice } from "../components/InvoiceTypes";

export interface PDFOptions {
  filename?: string;
  margin?: number | [number, number, number, number];
  image?: { type: "jpeg" | "png" | "webp"; quality: number };
  html2canvas?: { scale: number; useCORS: boolean };
  jsPDF?: { unit: string; format: string; orientation: "portrait" | "landscape" };
}

export const generateInvoicePDF = async (
  element: HTMLElement,
  invoice: Invoice,
  options?: Partial<PDFOptions>
): Promise<void> => {
  const defaultOptions: any = {
    filename: `invoice-${invoice.invoice_number}.pdf`,
    margin: [10, 10, 10, 10],
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    ...options
  };

  try {
    await html2pdf()
      .set(defaultOptions)
      .from(element)
      .save();
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF");
  }
};

export const previewInvoicePDF = async (
  element: HTMLElement,
  invoice: Invoice
): Promise<string> => {
  try {
    const pdf = await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      })
      .from(element)
      .outputPdf("dataurlstring");

    return pdf;
  } catch (error) {
    console.error("Error previewing PDF:", error);
    throw new Error("Failed to preview PDF");
  }
};

export const downloadInvoicePDF = async (
  element: HTMLElement,
  invoice: Invoice,
  filename?: string
): Promise<void> => {
  await generateInvoicePDF(element, invoice, {
    filename: filename || `invoice-${invoice.invoice_number}.pdf`
  });
};
