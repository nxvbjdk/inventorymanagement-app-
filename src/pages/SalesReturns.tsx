import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FloatingInput } from "@/components/ui/floating-input";
import { RippleButton } from "@/components/ui/ripple-button";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { Plus, Search, RotateCcw, CheckCircle, Clock, XCircle, Eye, Edit2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface SalesReturn {
  id: number;
  return_number: string;
  customer_id: number;
  invoice_id?: number;
  return_date: string;
  reason: string;
  status: string;
  refund_method?: string;
  total_amount: number;
  created_at: string;
}

interface Customer {
  id: number;
  contact_name: string;
  company_name?: string;
}

const SalesReturns = () => {
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [returnsRes, customersRes] = await Promise.all([
        supabase.from("sales_returns").select("*").order("created_at", { ascending: false }),
        supabase.from("customers").select("id, contact_name, company_name")
      ]);

      if (returnsRes.error) throw returnsRes.error;
      if (customersRes.error) throw customersRes.error;

      setReturns(returnsRes.data || []);
      setCustomers(customersRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load sales returns");
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
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      approved: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      rejected: "bg-red-500/10 text-red-500 border-red-500/20",
      completed: "bg-green-500/10 text-green-500 border-green-500/20"
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      completed: CheckCircle
    };
    const Icon = icons[status] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  const filteredReturns = returns.filter(ret => {
    const matchesSearch = ret.return_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getCustomerName(ret.customer_id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || ret.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: returns.length,
    pending: returns.filter(r => r.status === "pending").length,
    approved: returns.filter(r => r.status === "approved").length,
    completed: returns.filter(r => r.status === "completed").length,
    totalAmount: returns.reduce((sum, r) => sum + r.total_amount, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading sales returns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Sales Returns</h1>
          <p className="text-muted-foreground mt-1">Process customer returns and refunds</p>
        </div>
        <MagneticButton strength={0.2}>
          <Button size="lg" className="gap-2 premium-shadow">
            <Plus className="h-4 w-4" />
            New Return
          </Button>
        </MagneticButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="card-premium p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Returns</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <RotateCcw className="h-8 w-8 text-primary/60" />
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
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold mt-1">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500/60" />
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
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold mt-1">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500/60" />
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
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold mt-1">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/60" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="card-premium p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold mt-1">${stats.totalAmount.toFixed(2)}</p>
              </div>
              <RotateCcw className="h-8 w-8 text-purple-500/60" />
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
                label="Search returns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {["all", "pending", "approved", "rejected", "completed"].map((status) => (
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

      {/* Sales Returns List */}
      <Card className="card-premium">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Return #</th>
                <th className="text-left p-4 font-medium">Customer</th>
                <th className="text-left p-4 font-medium">Return Date</th>
                <th className="text-left p-4 font-medium">Reason</th>
                <th className="text-left p-4 font-medium">Amount</th>
                <th className="text-left p-4 font-medium">Refund Method</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredReturns.map((ret, index) => (
                  <motion.tr
                    key={ret.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-4 font-medium">{ret.return_number}</td>
                    <td className="p-4">{getCustomerName(ret.customer_id)}</td>
                    <td className="p-4">{new Date(ret.return_date).toLocaleDateString()}</td>
                    <td className="p-4 max-w-xs truncate">{ret.reason}</td>
                    <td className="p-4 font-medium">${ret.total_amount.toFixed(2)}</td>
                    <td className="p-4 capitalize">{ret.refund_method || "-"}</td>
                    <td className="p-4">
                      <Badge className={`${getStatusColor(ret.status)} flex items-center gap-1 w-fit`}>
                        {getStatusIcon(ret.status)}
                        {ret.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <RippleButton size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
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
          {filteredReturns.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <RotateCcw className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No sales returns found</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SalesReturns;
