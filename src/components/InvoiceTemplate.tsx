import { forwardRef } from "react";
import type { Invoice } from "./InvoiceTypes.ts";

interface InvoiceTemplateProps {
  invoice: Invoice;
  customer: any;
  invoiceItems: any[];
  companyInfo?: {
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    logo?: string;
  };
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ invoice, customer, invoiceItems, companyInfo }, ref) => {
    const formatCurrency = (amount: number, currencyCode: string) => {
      const symbols: Record<string, string> = {
        USD: "$", EUR: "€", GBP: "£", CAD: "C$", AUD: "A$", JPY: "¥", INR: "₹"
      };
      return `${symbols[currencyCode] || currencyCode} ${amount.toFixed(2)}`;
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    };

    return (
      <div ref={ref} className="bg-white text-black p-12 max-w-4xl mx-auto" style={{ fontFamily: "Arial, sans-serif" }}>
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            {companyInfo?.logo && (
              <img src={companyInfo.logo} alt="Company Logo" className="h-16 mb-4" />
            )}
            <h1 className="text-3xl font-bold text-gray-900">{companyInfo?.name || "Your Company"}</h1>
            <div className="text-sm text-gray-600 mt-2">
              <p>{companyInfo?.address || "123 Business Street"}</p>
              <p>{companyInfo?.city || "City, State 12345"}</p>
              <p className="mt-1">{companyInfo?.phone || "+1 (555) 123-4567"}</p>
              <p>{companyInfo?.email || "info@company.com"}</p>
            </div>
          </div>
          
          <div className="text-right">
            <h2 className="text-4xl font-bold text-blue-600 mb-2">INVOICE</h2>
            <div className="text-sm space-y-1">
              <div className="flex justify-end gap-2">
                <span className="font-semibold">Invoice #:</span>
                <span>{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-end gap-2">
                <span className="font-semibold">Date:</span>
                <span>{formatDate(invoice.issue_date)}</span>
              </div>
              <div className="flex justify-end gap-2">
                <span className="font-semibold">Due Date:</span>
                <span>{formatDate(invoice.due_date)}</span>
              </div>
              <div className="flex justify-end gap-2">
                <span className="font-semibold">Status:</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded uppercase text-xs font-semibold">
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To Section */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Bill To:</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-bold text-lg">{customer?.company_name || customer?.contact_name}</p>
            {customer?.company_name && <p className="text-sm text-gray-600">{customer?.contact_name}</p>}
            <p className="text-sm text-gray-600 mt-1">{customer?.email}</p>
            {customer?.phone && <p className="text-sm text-gray-600">{customer?.phone}</p>}
            {customer?.address && (
              <div className="text-sm text-gray-600 mt-2">
                <p>{customer?.address}</p>
                <p>{customer?.city}, {customer?.state} {customer?.postal_code}</p>
                {customer?.country && <p>{customer?.country}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Invoice Items Table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="text-left p-3 font-semibold">#</th>
              <th className="text-left p-3 font-semibold">Description</th>
              <th className="text-right p-3 font-semibold">Qty</th>
              <th className="text-right p-3 font-semibold">Unit Price</th>
              <th className="text-right p-3 font-semibold">Discount</th>
              <th className="text-right p-3 font-semibold">Tax</th>
              <th className="text-right p-3 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoiceItems.map((item, index) => (
              <tr key={item.id} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                <td className="p-3 text-gray-700">{index + 1}</td>
                <td className="p-3">
                  <div className="font-medium text-gray-900">{item.description}</div>
                </td>
                <td className="text-right p-3 text-gray-700">{item.quantity}</td>
                <td className="text-right p-3 text-gray-700">
                  {formatCurrency(item.unit_price, invoice.currency_code)}
                </td>
                <td className="text-right p-3 text-gray-700">{item.discount_percent}%</td>
                <td className="text-right p-3 text-gray-700">{item.tax_percent}%</td>
                <td className="text-right p-3 font-semibold text-gray-900">
                  {formatCurrency(item.line_total, invoice.currency_code)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">{formatCurrency(invoice.subtotal || 0, invoice.currency_code)}</span>
              </div>
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-semibold text-red-600">
                    -{formatCurrency(invoice.discount_amount, invoice.currency_code)}
                  </span>
                </div>
              )}
              {invoice.tax_amount > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-semibold">{formatCurrency(invoice.tax_amount, invoice.currency_code)}</span>
                </div>
              )}
              {invoice.shipping_amount > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-semibold">{formatCurrency(invoice.shipping_amount, invoice.currency_code)}</span>
                </div>
              )}
              <div className="flex justify-between py-3 bg-blue-600 text-white px-4 rounded-lg mt-2">
                <span className="font-bold text-lg">Total Amount:</span>
                <span className="font-bold text-lg">
                  {formatCurrency(invoice.total_amount || 0, invoice.currency_code)}
                </span>
              </div>
              {invoice.paid_amount > 0 && (
                <>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(invoice.paid_amount, invoice.currency_code)}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 bg-green-100 px-4 rounded-lg">
                    <span className="font-bold text-green-800">Balance Due:</span>
                    <span className="font-bold text-green-800">
                      {formatCurrency(invoice.balance_due || 0, invoice.currency_code)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Notes and Terms */}
        <div className="space-y-6">
          {invoice.notes && (
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Notes:</h3>
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                {invoice.notes}
              </div>
            </div>
          )}
          
          {invoice.terms_and_conditions && (
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Terms & Conditions:</h3>
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                {invoice.terms_and_conditions}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t-2 border-gray-300 text-center text-xs text-gray-500">
          <p>Thank you for your business!</p>
          <p className="mt-1">
            For questions about this invoice, please contact {companyInfo?.email || "info@company.com"}
          </p>
        </div>
      </div>
    );
  }
);

InvoiceTemplate.displayName = "InvoiceTemplate";
