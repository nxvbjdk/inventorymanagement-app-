import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FloatingInput } from "@/components/ui/floating-input";
import { RippleButton } from "@/components/ui/ripple-button";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { Plus, Search, FileText, Download, Eye, Edit2, Trash2, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface CreditNote {
  id: number;
  credit_note_number: string;
  customer_id: number;
  invoice_id?: number;
  issue_date: string;
  reason: string;
  currency_code: string;
  amount: number;
  applied_amount: number;
  balance: number;
  status: string;
  created_at: string;
}

interface Customer {
  id: number;
  contact_name: string;
  company_name?: string;
}

const CreditNotes = () => {
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [creditNotesRes, customersRes] = await Promise.all([
        supabase.from("credit_notes").select("*").order("created_at", { ascending: false }),
        supabase.from("customers").select("id, contact_name, company_name")
      ]);

      if (creditNotesRes.error) throw creditNotesRes.error;
      if (customersRes.error) throw customersRes.error;

      setCreditNotes(creditNotesRes.data || []);
      setCustomers(customersRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load credit notes");
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.company_name || customer?.contact_name || "Unknown";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      applied: "bg-green-500/10 text-green-500 border-green-500/20",
      cancelled: "bg-gray-500/10 text-gray-500 border-gray-500/20"
    };
    return colors[status] || colors.open;
  };

  const filteredNotes = creditNotes.filter(note => {
    const matchesSearch = note.credit_note_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getCustomerName(note.customer_id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || note.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: creditNotes.length,
    open: creditNotes.filter(n => n.status === "open").length,
    applied: creditNotes.filter(n => n.status === "applied").length,
    totalAmount: creditNotes.reduce((sum, n) => sum + (n.balance || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading credit notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Credit Notes</h1>
          <p className="text-muted-foreground mt-1">Manage customer credits and refunds</p>
        </div>
        <MagneticButton strength={0.2}>
          <Button size="lg" className="gap-2 premium-shadow">
            <Plus className="h-4 w-4" />
            New Credit Note
          </Button>
        </MagneticButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="card-premium p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Credit Notes</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-primary/60" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="card-premium p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Credits</p>
                <p className="text-2xl font-bold mt-1">{stats.open}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500/60" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="card-premium p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Applied Credits</p>
                <p className="text-2xl font-bold mt-1">{stats.applied}</p>
              </div>
              <XCircle className="h-8 w-8 text-green-500/60" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="card-premium p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold mt-1">${stats.totalAmount.toFixed(2)}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500/60" />
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card className="card-premium p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <FloatingInput
                label="Search credit notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {["all", "open", "applied", "cancelled"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                onClick={() => setStatusFilter(status)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Credit Notes List */}
      <Card className="card-premium">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Credit Note #</th>
                <th className="text-left p-4 font-medium">Customer</th>
                <th className="text-left p-4 font-medium">Issue Date</th>
                <th className="text-left p-4 font-medium">Amount</th>
                <th className="text-left p-4 font-medium">Applied</th>
                <th className="text-left p-4 font-medium">Balance</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredNotes.map((note, index) => (
                  <motion.tr
                    key={note.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-4 font-medium">{note.credit_note_number}</td>
                    <td className="p-4">{getCustomerName(note.customer_id)}</td>
                    <td className="p-4">{new Date(note.issue_date).toLocaleDateString()}</td>
                    <td className="p-4">{note.currency_code} {note.amount.toFixed(2)}</td>
                    <td className="p-4">{note.currency_code} {note.applied_amount.toFixed(2)}</td>
                    <td className="p-4 font-medium">{note.currency_code} {note.balance.toFixed(2)}</td>
                    <td className="p-4">
                      <Badge className={getStatusColor(note.status)}>
                        {note.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <RippleButton size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </RippleButton>
                        <RippleButton size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </RippleButton>
                        <RippleButton size="sm" variant="ghost">
                          <Edit2 className="h-4 w-4" />
                        </RippleButton>
                        <RippleButton size="sm" variant="ghost" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </RippleButton>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredNotes.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No credit notes found</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CreditNotes;
