export interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer?: { contact_name: string; company_name?: string; };
  invoice_type: string;
  status: string;
  issue_date: string;
  due_date: string;
  payment_date?: string;
  currency_code: string;
  exchange_rate: number;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  shipping_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  notes?: string;
  terms_and_conditions?: string;
  language: string;
  approval_status: string;
  created_at: string;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  inventory_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_percent: number;
  line_total: number;
}

export interface Customer {
  id: number;
  contact_name: string;
  company_name?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  tax_id?: string;
  currency_code: string;
  payment_terms: number;
}
