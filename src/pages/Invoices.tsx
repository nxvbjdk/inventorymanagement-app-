import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Plus, Search, Filter, Download, Send, Eye, Edit2, Trash2,
  DollarSign, Calendar, User, Globe, CreditCard, AlertCircle, CheckCircle, Printer
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FloatingInput } from "@/components/ui/floating-input";
import { RippleButton } from "@/components/ui/ripple-button";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { toast } from "@/components/ui/premium-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { InvoiceTemplate } from "@/components/InvoiceTemplate";
import { downloadInvoicePDF } from "@/lib/pdfGenerator";
import type { Invoice as InvoiceType } from "@/components/InvoiceTypes";

interface Invoice {
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

interface Currency {
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
}

const Invoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [dbNotSetup, setDbNotSetup] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const invoiceTemplateRef = useRef<HTMLDivElement>(null);

  // Form state for new invoice
  const [formData, setFormData] = useState({
    customer_id: "",
    invoice_type: "standard",
    issue_date: new Date().toISOString().split('T')[0],
    due_date: "",
    currency_code: "USD",
    language: "en",
    notes: "",
    terms_and_conditions: "",
  });

  useEffect(() => {
    loadInvoices();
    loadCurrencies();
    loadCustomers();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          customer:customers(contact_name, company_name)
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
      setDbNotSetup(false);
    } catch (error: any) {
      console.error("Error loading invoices:", error);
      
      // Check if it's a 404 error (table doesn't exist)
      if (error.code === 'PGRST116' || error.message?.includes('404') || error.status === 404) {
        setDbNotSetup(true);
      } else {
        toast.error("Failed to load invoices");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCurrencies = async () => {
    try {
      const { data, error } = await supabase
        .from("currencies")
        .select("*")
        .eq("is_active", true)
        .order("code");

      if (error) throw error;
      setCurrencies(data || []);
    } catch (error: any) {
      console.error("Error loading currencies:", error);
    }
  };

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, contact_name, company_name, email")
        .eq("user_id", user?.id)
        .order("contact_name");

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      console.error("Error loading customers:", error);
    }
  };

  const handleCreateInvoice = async () => {
    try {
      // Validate required fields
      if (!formData.customer_id) {
        toast.error("Please select a customer");
        return;
      }
      if (!formData.due_date) {
        toast.error("Please select a due date");
        return;
      }

      // Generate invoice number
      const { data: invoiceNumber, error: fnError } = await supabase.rpc("generate_invoice_number");
      if (fnError) throw fnError;

      // Prepare data with proper type conversion
      const invoiceData = {
        user_id: user?.id,
        invoice_number: invoiceNumber,
        customer_id: parseInt(formData.customer_id),
        invoice_type: formData.invoice_type,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        currency_code: formData.currency_code,
        language: formData.language,
        notes: formData.notes || null,
        terms_and_conditions: formData.terms_and_conditions || null,
        status: "draft",
        approval_status: "pending",
      };

      const { data, error } = await supabase
        .from("invoices")
        .insert(invoiceData)
        .select()
        .single();

      if (error) throw error;

      toast.success("Invoice created successfully!");
      setIsCreateDialogOpen(false);
      loadInvoices();
      
      // Reset form
      setFormData({
        customer_id: "",
        invoice_type: "standard",
        issue_date: new Date().toISOString().split('T')[0],
        due_date: "",
        currency_code: "USD",
        language: "en",
        notes: "",
        terms_and_conditions: "",
      });
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      toast.error(error.message || "Failed to create invoice");
    }
  };

  const handleDeleteInvoice = async (id: number) => {
    try {
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Invoice deleted successfully!");
      loadInvoices();
    } catch (error: any) {
      console.error("Error deleting invoice:", error);
      toast.error(error.message || "Failed to delete invoice");
    }
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    toast.loading("Sending invoice...");
    // Simulate email sending
    setTimeout(() => {
      toast.success(`Invoice ${invoice.invoice_number} sent successfully!`);
    }, 1500);
  };

  const loadInvoiceItems = async (invoiceId: number) => {
    try {
      const { data, error } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoiceId);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error("Error loading invoice items:", error);
      return [];
    }
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    const items = await loadInvoiceItems(invoice.id);
    setInvoiceItems(items);
    setSelectedInvoice(invoice);
    setIsPreviewOpen(true);
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      setIsGeneratingPDF(true);
      const items = await loadInvoiceItems(invoice.id);
      setInvoiceItems(items);
      setSelectedInvoice(invoice);

      // Wait for template to render
      await new Promise(resolve => setTimeout(resolve, 100));

      if (invoiceTemplateRef.current) {
        await downloadInvoicePDF(invoiceTemplateRef.current, invoice);
        toast.success("Invoice downloaded successfully!");
      }
    } catch (error: any) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download invoice");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrintInvoice = async (invoice: Invoice) => {
    const items = await loadInvoiceItems(invoice.id);
    setInvoiceItems(items);
    setSelectedInvoice(invoice);
    setIsPreviewOpen(true);
    
    // Wait for dialog to open and render
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
      viewed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200",
      paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
      overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
      cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    };
    return colors[status] || colors.draft;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "retainer": return "🔒";
      case "recurring": return "🔄";
      case "proforma": return "📋";
      default: return "📄";
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-subtle p-6 space-y-6">
      {/* Database Setup Alert */}
      {dbNotSetup && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-300 mb-2">
                    🗄️ Database Setup Required
                  </h3>
                  <p className="text-orange-800 dark:text-orange-400 mb-3">
                    The invoicing tables haven't been created yet. Please run the SQL schema in your Supabase SQL Editor:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-orange-800 dark:text-orange-400 mb-4">
                    <li>Open <code className="px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/40 font-mono">supabase-invoicing-schema.sql</code></li>
                    <li>Copy the entire contents</li>
                    <li>Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline font-medium">Supabase Dashboard</a> → SQL Editor</li>
                    <li>Paste and run the SQL</li>
                    <li>Refresh this page</li>
                  </ol>
                  <div className="flex gap-3">
                    <a 
                      href="https://supabase.com/dashboard" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors font-medium text-sm"
                    >
                      Open Supabase Dashboard →
                    </a>
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.reload()}
                      className="border-orange-300 dark:border-orange-800"
                    >
                      Refresh Page
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-display font-bold text-gradient-hero flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Invoices
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage invoices, payments, and billing
          </p>
        </div>
        <MagneticButton
          onClick={() => setIsCreateDialogOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Invoice
        </MagneticButton>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        {[
          { label: "Total Invoices", value: invoices.length, icon: FileText, color: "text-blue-600" },
          { label: "Paid", value: invoices.filter(i => i.status === "paid").length, icon: CheckCircle, color: "text-green-600" },
          { label: "Pending", value: invoices.filter(i => ["draft", "sent", "viewed"].includes(i.status)).length, icon: AlertCircle, color: "text-yellow-600" },
          { label: "Overdue", value: invoices.filter(i => i.status === "overdue").length, icon: AlertCircle, color: "text-red-600" },
        ].map((stat, index) => (
          <Card key={stat.label} className="stat-card-premium">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-${stat.color}/10`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Filters */}
      <Card className="card-glass">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="viewed">Viewed</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>{filteredInvoices.length} invoices found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="skeleton h-20 rounded-lg" />
                ))}
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No invoices found</p>
              </div>
            ) : (
              filteredInvoices.map((invoice) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{getTypeIcon(invoice.invoice_type)}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{invoice.invoice_number}</p>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status}
                          </Badge>
                          {invoice.language !== "en" && (
                            <Badge variant="outline" className="gap-1">
                              <Globe className="h-3 w-3" />
                              {invoice.language.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {invoice.customer?.company_name || invoice.customer?.contact_name}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {new Date(invoice.due_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {invoice.currency_code} {invoice.total_amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <RippleButton 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleViewInvoice(invoice)}
                        title="Preview Invoice"
                      >
                        <Eye className="h-4 w-4" />
                      </RippleButton>
                      <RippleButton 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDownloadPDF(invoice)}
                        disabled={isGeneratingPDF}
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </RippleButton>
                      <RippleButton 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handlePrintInvoice(invoice)}
                        title="Print Invoice"
                      >
                        <Printer className="h-4 w-4" />
                      </RippleButton>
                      <RippleButton 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleSendInvoice(invoice)}
                        title="Send Invoice"
                      >
                        <Send className="h-4 w-4" />
                      </RippleButton>
                      <RippleButton 
                        size="sm" 
                        variant="outline"
                        title="Edit Invoice"
                      >
                        <Edit2 className="h-4 w-4" />
                      </RippleButton>
                      <RippleButton 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          if (confirm(`Delete invoice ${invoice.invoice_number}?`)) {
                            handleDeleteInvoice(invoice.id);
                          }
                        }}
                        title="Delete Invoice"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </RippleButton>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Create a new invoice with multi-currency and multi-language support
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Customer *</label>
                {customers.length === 0 && (
                  <Button 
                    size="sm" 
                    variant="link" 
                    onClick={() => window.open('/customers', '_blank')}
                    className="text-xs"
                  >
                    + Create Customer
                  </Button>
                )}
              </div>
              <Select
                value={formData.customer_id}
                onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.company_name || customer.contact_name} ({customer.email})
                    </SelectItem>
                  ))}
                  {customers.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground">
                      No customers found. Please create a customer first.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Invoice Type</label>
                <Select
                  value={formData.invoice_type}
                  onValueChange={(value) => setFormData({ ...formData, invoice_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">📄 Standard Invoice</SelectItem>
                    <SelectItem value="retainer">🔒 Retainer Invoice</SelectItem>
                    <SelectItem value="proforma">📋 Proforma Invoice</SelectItem>
                    <SelectItem value="recurring">🔄 Recurring Invoice</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Currency</label>
                <Select
                  value={formData.currency_code}
                  onValueChange={(value) => setFormData({ ...formData, currency_code: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.code} - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FloatingInput
                label="Issue Date"
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
              />
              <FloatingInput
                label="Due Date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Language</label>
              <Select
                value={formData.language}
                onValueChange={(value) => setFormData({ ...formData, language: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                  <SelectItem value="es">🇪🇸 Spanish</SelectItem>
                  <SelectItem value="fr">🇫🇷 French</SelectItem>
                  <SelectItem value="de">🇩🇪 German</SelectItem>
                  <SelectItem value="it">🇮🇹 Italian</SelectItem>
                  <SelectItem value="pt">🇵🇹 Portuguese</SelectItem>
                  <SelectItem value="zh">🇨🇳 Chinese</SelectItem>
                  <SelectItem value="ja">🇯🇵 Japanese</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <FloatingInput
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />

            <FloatingInput
              label="Terms & Conditions"
              value={formData.terms_and_conditions}
              onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <RippleButton onClick={handleCreateInvoice}>
              Create Invoice
            </RippleButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogDescription>
              {selectedInvoice?.invoice_number} - {selectedInvoice?.customer?.company_name || selectedInvoice?.customer?.contact_name}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              <div className="flex gap-2 justify-end print:hidden">
                <Button 
                  variant="outline" 
                  onClick={() => handleDownloadPDF(selectedInvoice)}
                  disabled={isGeneratingPDF}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isGeneratingPDF ? "Generating..." : "Download PDF"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.print()}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button onClick={() => handleSendInvoice(selectedInvoice)}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invoice
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <InvoiceTemplate
                  ref={invoiceTemplateRef}
                  invoice={selectedInvoice}
                  customer={selectedInvoice.customer || {}}
                  invoiceItems={invoiceItems}
                  companyInfo={{
                    name: "Digiedge Technologies",
                    address: "Unity Plus 624",
                    city: "Rajkot,Gujarat",
                    phone: "+91886659015",
                    email: "info@digiedge.com"
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden template for PDF generation */}
      {selectedInvoice && !isPreviewOpen && (
        <div className="fixed -left-[9999px] top-0">
          <InvoiceTemplate
            ref={invoiceTemplateRef}
            invoice={selectedInvoice}
            customer={selectedInvoice.customer || {}}
            invoiceItems={invoiceItems}
            companyInfo={{
              name: "Your Company Name",
              address: "123 Business Street",
              city: "City, State 12345",
              phone: "+1 (555) 123-4567",
              email: "info@yourcompany.com"
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Invoices;
