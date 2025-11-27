import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FloatingInput } from "@/components/ui/floating-input";
import { RippleButton } from "@/components/ui/ripple-button";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { 
  RotateCcw, Plus, CheckCircle, Clock, Truck, Package, XCircle, 
  MapPin, Calendar, DollarSign, AlertCircle, Eye, ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Return {
  id: number;
  return_number: string;
  customer_id: number;
  order_id: number;
  return_type: string;
  status: string;
  reason: string;
  refund_amount: number;
  pickup_address: string;
  pickup_scheduled_at?: string;
  picked_up_at?: string;
  received_at?: string;
  tracking_number?: string;
  carrier?: string;
  created_at: string;
  order?: { order_number: string; customer_name: string; };
}

interface ReversePickup {
  return_id: number;
  carrier: string;
  pickup_date: string;
  pickup_time_slot: string;
  pickup_address: string;
  contact_name: string;
  contact_phone: string;
  pickup_instructions?: string;
}

const CARRIERS = [
  { value: "fedex", label: "FedEx" },
  { value: "ups", label: "UPS" },
  { value: "usps", label: "USPS" },
  { value: "dhl", label: "DHL" },
  { value: "bluedart", label: "Blue Dart" },
  { value: "delhivery", label: "Delhivery" }
];

const TIME_SLOTS = [
  "9:00 AM - 12:00 PM",
  "12:00 PM - 3:00 PM",
  "3:00 PM - 6:00 PM",
  "6:00 PM - 9:00 PM"
];

const ReturnsPage = () => {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPickupDialogOpen, setIsPickupDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [pickupForm, setPickupForm] = useState<ReversePickup>({
    return_id: 0,
    carrier: "fedex",
    pickup_date: "",
    pickup_time_slot: "9:00 AM - 12:00 PM",
    pickup_address: "",
    contact_name: "",
    contact_phone: "",
    pickup_instructions: ""
  });

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    try {
      const { data, error } = await supabase
        .from("returns")
        .select(`
          *,
          order:orders(order_number, customer_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReturns(data || []);
    } catch (error: any) {
      console.error("Error loading returns:", error);
      toast.error("Failed to load returns");
    } finally {
      setLoading(false);
    }
  };

  const handleSchedulePickup = async () => {
    try {
      if (!selectedReturn) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert pickup
      const { error: pickupError } = await supabase
        .from("reverse_pickups")
        .insert({
          user_id: user.id,
          ...pickupForm
        });

      if (pickupError) throw pickupError;

      // Update return status
      const { error: returnError } = await supabase
        .from("returns")
        .update({
          status: "picked_up",
          pickup_scheduled_at: new Date(pickupForm.pickup_date).toISOString(),
          carrier: pickupForm.carrier
        })
        .eq("id", selectedReturn.id);

      if (returnError) throw returnError;

      toast.success("Reverse pickup scheduled successfully!");
      setIsPickupDialogOpen(false);
      loadReturns();
    } catch (error: any) {
      console.error("Error scheduling pickup:", error);
      toast.error("Failed to schedule pickup");
    }
  };

  const handleStatusChange = async (returnId: number, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      const now = new Date().toISOString();

      if (newStatus === "picked_up") updateData.picked_up_at = now;
      if (newStatus === "received") updateData.received_at = now;
      if (newStatus === "inspected") updateData.inspected_at = now;
      if (newStatus === "refunded") updateData.refunded_at = now;
      if (newStatus === "completed") updateData.completed_at = now;

      const { error } = await supabase
        .from("returns")
        .update(updateData)
        .eq("id", returnId);

      if (error) throw error;

      toast.success(`Return status updated to ${newStatus}`);
      loadReturns();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      requested: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      approved: "bg-green-500/10 text-green-500 border-green-500/20",
      picked_up: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      received: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
      inspected: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      refunded: "bg-green-500/10 text-green-500 border-green-500/20",
      rejected: "bg-red-500/10 text-red-500 border-red-500/20",
      completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    };
    return colors[status] || colors.requested;
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      requested: Clock,
      approved: CheckCircle,
      picked_up: Truck,
      received: Package,
      inspected: CheckCircle,
      refunded: DollarSign,
      rejected: XCircle,
      completed: CheckCircle
    };
    const Icon = icons[status] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  const filteredReturns = returns.filter(ret => {
    const matchesSearch = 
      ret.return_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.order?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || ret.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: returns.length,
    requested: returns.filter(r => r.status === "requested").length,
    approved: returns.filter(r => r.status === "approved").length,
    in_transit: returns.filter(r => r.status === "picked_up").length,
    completed: returns.filter(r => r.status === "completed").length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading returns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Returns & Reverse Pickup</h1>
          <p className="text-muted-foreground mt-1">Manage returns and schedule reverse pickups</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="card-premium p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Returns</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <RotateCcw className="h-8 w-8 text-primary/60" />
          </div>
        </Card>
        <Card className="card-premium p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Requested</p>
              <p className="text-2xl font-bold mt-1">{stats.requested}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500/60" />
          </div>
        </Card>
        <Card className="card-premium p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold mt-1">{stats.approved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500/60" />
          </div>
        </Card>
        <Card className="card-premium p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Transit</p>
              <p className="text-2xl font-bold mt-1">{stats.in_transit}</p>
            </div>
            <Truck className="h-8 w-8 text-purple-500/60" />
          </div>
        </Card>
        <Card className="card-premium p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold mt-1">{stats.completed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-emerald-500/60" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card-premium p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FloatingInput
              label="Search returns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "requested", "approved", "picked_up", "received", "inspected", "refunded", "completed"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                onClick={() => setStatusFilter(status)}
                className="capitalize"
                size="sm"
              >
                {status.replace("_", " ")}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Returns List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredReturns.map((returnItem, index) => (
            <motion.div
              key={returnItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="card-premium p-6 hover:shadow-xl transition-all">
                <div className="space-y-4">
                  {/* Return Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg">{returnItem.return_number}</h3>
                        <Badge className={`${getStatusColor(returnItem.status)} flex items-center gap-1`}>
                          {getStatusIcon(returnItem.status)}
                          {returnItem.status.replace("_", " ")}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {returnItem.return_type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Order: {returnItem.order?.order_number}</span>
                        <span>Customer: {returnItem.order?.customer_name}</span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          ${returnItem.refund_amount?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <RippleButton
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedReturn(returnItem);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </RippleButton>
                    </div>
                  </div>

                  {/* Return Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Reason</p>
                      <p className="font-medium">{returnItem.reason}</p>
                    </div>
                    {returnItem.tracking_number && (
                      <div>
                        <p className="text-muted-foreground">Tracking</p>
                        <p className="font-medium">{returnItem.tracking_number}</p>
                      </div>
                    )}
                    {returnItem.carrier && (
                      <div>
                        <p className="text-muted-foreground">Carrier</p>
                        <p className="font-medium capitalize">{returnItem.carrier}</p>
                      </div>
                    )}
                    {returnItem.pickup_scheduled_at && (
                      <div>
                        <p className="text-muted-foreground">Pickup Date</p>
                        <p className="font-medium">
                          {new Date(returnItem.pickup_scheduled_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    {returnItem.status === "requested" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(returnItem.id, "approved")}
                        >
                          Approve Return
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(returnItem.id, "rejected")}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {returnItem.status === "approved" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedReturn(returnItem);
                          setPickupForm({
                            ...pickupForm,
                            return_id: returnItem.id,
                            pickup_address: returnItem.pickup_address
                          });
                          setIsPickupDialogOpen(true);
                        }}
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Schedule Pickup
                      </Button>
                    )}
                    {returnItem.status === "picked_up" && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(returnItem.id, "received")}
                      >
                        Mark as Received
                      </Button>
                    )}
                    {returnItem.status === "received" && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(returnItem.id, "inspected")}
                      >
                        Inspect Return
                      </Button>
                    )}
                    {returnItem.status === "inspected" && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(returnItem.id, "refunded")}
                      >
                        Process Refund
                      </Button>
                    )}
                    {returnItem.status === "refunded" && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(returnItem.id, "completed")}
                      >
                        Complete Return
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredReturns.length === 0 && (
          <Card className="card-premium p-12 text-center">
            <RotateCcw className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No returns found</h3>
            <p className="text-muted-foreground">Returns will appear here once customers request them</p>
          </Card>
        )}
      </div>

      {/* Schedule Pickup Dialog */}
      <Dialog open={isPickupDialogOpen} onOpenChange={setIsPickupDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Reverse Pickup</DialogTitle>
            <DialogDescription>
              Arrange pickup for return {selectedReturn?.return_number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Carrier</label>
              <Select
                value={pickupForm.carrier}
                onValueChange={(value) => setPickupForm({ ...pickupForm, carrier: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CARRIERS.map((carrier) => (
                    <SelectItem key={carrier.value} value={carrier.value}>
                      {carrier.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FloatingInput
                label="Pickup Date"
                type="date"
                value={pickupForm.pickup_date}
                onChange={(e) => setPickupForm({ ...pickupForm, pickup_date: e.target.value })}
              />

              <div>
                <label className="text-sm font-medium mb-2 block">Time Slot</label>
                <Select
                  value={pickupForm.pickup_time_slot}
                  onValueChange={(value) => setPickupForm({ ...pickupForm, pickup_time_slot: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <FloatingInput
              label="Pickup Address"
              value={pickupForm.pickup_address}
              onChange={(e) => setPickupForm({ ...pickupForm, pickup_address: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <FloatingInput
                label="Contact Name"
                value={pickupForm.contact_name}
                onChange={(e) => setPickupForm({ ...pickupForm, contact_name: e.target.value })}
              />

              <FloatingInput
                label="Contact Phone"
                value={pickupForm.contact_phone}
                onChange={(e) => setPickupForm({ ...pickupForm, contact_phone: e.target.value })}
              />
            </div>

            <FloatingInput
              label="Pickup Instructions (Optional)"
              value={pickupForm.pickup_instructions || ""}
              onChange={(e) => setPickupForm({ ...pickupForm, pickup_instructions: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPickupDialogOpen(false)}>
              Cancel
            </Button>
            <RippleButton onClick={handleSchedulePickup}>
              <Truck className="h-4 w-4 mr-2" />
              Schedule Pickup
            </RippleButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Return Details</DialogTitle>
            <DialogDescription>
              {selectedReturn?.return_number}
            </DialogDescription>
          </DialogHeader>

          {selectedReturn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order Number</p>
                  <p className="font-medium">{selectedReturn.order?.order_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedReturn.order?.customer_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Return Type</p>
                  <p className="font-medium capitalize">{selectedReturn.return_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedReturn.status)}>
                    {selectedReturn.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Refund Amount</p>
                  <p className="font-medium">${selectedReturn.refund_amount?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Requested Date</p>
                  <p className="font-medium">
                    {new Date(selectedReturn.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground text-sm mb-1">Reason</p>
                <p className="font-medium">{selectedReturn.reason}</p>
              </div>

              <div>
                <p className="text-muted-foreground text-sm mb-1">Pickup Address</p>
                <p className="font-medium">{selectedReturn.pickup_address}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReturnsPage;
