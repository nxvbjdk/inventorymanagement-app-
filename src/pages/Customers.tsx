import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Mail, Phone, MapPin, CreditCard, Globe, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FloatingInput } from "@/components/ui/floating-input";
import { RippleButton } from "@/components/ui/ripple-button";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/premium-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

interface Customer {
  id: number;
  company_name?: string;
  contact_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  currency_code: string;
  payment_terms: number;
  preferred_language: string;
  portal_access: boolean;
}

const Customers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dbNotSetup, setDbNotSetup] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    currency_code: "USD",
    payment_terms: 30,
    preferred_language: "en",
    portal_access: false,
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
      setDbNotSetup(false);
    } catch (error: any) {
      if (error.code === 'PGRST116' || error.message?.includes('404') || error.status === 404) {
        setDbNotSetup(true);
      } else {
        toast.error("Failed to load customers");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const { error } = await supabase
        .from("customers")
        .insert({ ...formData, user_id: user?.id });

      if (error) throw error;
      toast.success("Customer added successfully!");
      setIsDialogOpen(false);
      loadCustomers();
    } catch (error: any) {
      toast.error(error.message || "Failed to add customer");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-6 space-y-6">
      {/* Database Setup Alert */}
      {dbNotSetup && (
        <Card className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              <div>
                <h3 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">Database Setup Required</h3>
                <p className="text-sm text-orange-800 dark:text-orange-400">
                  Run <code className="px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/40">supabase-invoicing-schema.sql</code> in your Supabase SQL Editor.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-gradient-hero flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Customers
          </h1>
          <p className="text-muted-foreground mt-1">Manage customer information and portal access</p>
        </div>
        <MagneticButton onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Customer
        </MagneticButton>
      </motion.div>

      <div className="grid gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded-lg" />)
        ) : customers.length === 0 ? (
          <Card className="card-glass">
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No customers yet</p>
            </CardContent>
          </Card>
        ) : (
          customers.map((customer) => (
            <motion.div key={customer.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="card-premium hover:shadow-lg transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{customer.company_name || customer.contact_name}</h3>
                        {customer.portal_access && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30">Portal Enabled</Badge>
                        )}
                        <Badge variant="outline" className="gap-1">
                          <Globe className="h-3 w-3" />
                          {customer.preferred_language.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-2"><Mail className="h-3 w-3" />{customer.email}</span>
                        {customer.phone && <span className="flex items-center gap-2"><Phone className="h-3 w-3" />{customer.phone}</span>}
                        {customer.address && <span className="flex items-center gap-2"><MapPin className="h-3 w-3" />{customer.city}, {customer.country}</span>}
                        <span className="flex items-center gap-2"><CreditCard className="h-3 w-3" />{customer.currency_code} • Net {customer.payment_terms} days</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>Create a new customer with multi-currency support</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FloatingInput label="Company Name" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} />
              <FloatingInput label="Contact Name" value={formData.contact_name} onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FloatingInput label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              <FloatingInput label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <FloatingInput label="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            <div className="grid grid-cols-3 gap-4">
              <FloatingInput label="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
              <FloatingInput label="Country" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
              <Select value={formData.currency_code} onValueChange={(value) => setFormData({ ...formData, currency_code: value })}>
                <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">$ USD</SelectItem>
                  <SelectItem value="EUR">€ EUR</SelectItem>
                  <SelectItem value="GBP">£ GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <RippleButton onClick={handleSubmit}>Add Customer</RippleButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;
