import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FloatingInput } from "@/components/ui/floating-input";
import { RippleButton } from "@/components/ui/ripple-button";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { 
  Package, CheckCircle, Clock, Truck, MapPin, User, Phone, Mail,
  Calendar, DollarSign, ChevronRight, Eye, Printer, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  payment_status: string;
  total_amount: number;
  currency_code: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  tracking_number?: string;
  carrier?: string;
  order_date: string;
  confirmed_at?: string;
  picked_at?: string;
  packed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  channel?: { name: string; type: string; };
}

const LIFECYCLE_STAGES = [
  { key: "received", label: "Received", icon: Package },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle },
  { key: "picked", label: "Picked", icon: CheckCircle },
  { key: "packed", label: "Packed", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: MapPin }
];

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          channel:channels(name, type)
        `)
        .order("order_date", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error("Error loading orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      const now = new Date().toISOString();

      // Set timestamp based on status
      if (newStatus === "confirmed") updateData.confirmed_at = now;
      if (newStatus === "picked") updateData.picked_at = now;
      if (newStatus === "packed") updateData.packed_at = now;
      if (newStatus === "shipped") updateData.shipped_at = now;
      if (newStatus === "delivered") updateData.delivered_at = now;

      const { error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId);

      if (error) throw error;

      toast.success(`Order status updated to ${newStatus}`);
      loadOrders();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      received: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      confirmed: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      picked: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
      packed: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      shipped: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      delivered: "bg-green-500/10 text-green-500 border-green-500/20",
      cancelled: "bg-red-500/10 text-red-500 border-red-500/20"
    };
    return colors[status] || colors.received;
  };

  const getCurrentStage = (order: Order): number => {
    if (order.delivered_at) return 5;
    if (order.shipped_at) return 4;
    if (order.packed_at) return 3;
    if (order.picked_at) return 2;
    if (order.confirmed_at) return 1;
    return 0;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    received: orders.filter(o => o.status === "received").length,
    processing: orders.filter(o => ["confirmed", "picked", "packed"].includes(o.status)).length,
    shipped: orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Orders</h1>
          <p className="text-muted-foreground mt-1">Track order lifecycle from received to delivered</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="card-premium p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <Package className="h-8 w-8 text-primary/60" />
          </div>
        </Card>
        <Card className="card-premium p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Received</p>
              <p className="text-2xl font-bold mt-1">{stats.received}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500/60" />
          </div>
        </Card>
        <Card className="card-premium p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Processing</p>
              <p className="text-2xl font-bold mt-1">{stats.processing}</p>
            </div>
            <Package className="h-8 w-8 text-purple-500/60" />
          </div>
        </Card>
        <Card className="card-premium p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Shipped</p>
              <p className="text-2xl font-bold mt-1">{stats.shipped}</p>
            </div>
            <Truck className="h-8 w-8 text-orange-500/60" />
          </div>
        </Card>
        <Card className="card-premium p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Delivered</p>
              <p className="text-2xl font-bold mt-1">{stats.delivered}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500/60" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card-premium p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FloatingInput
              label="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "received", "confirmed", "picked", "packed", "shipped", "delivered"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                onClick={() => setStatusFilter(status)}
                className="capitalize"
                size="sm"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="card-premium p-6 hover:shadow-xl transition-all">
                <div className="space-y-4">
                  {/* Order Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg">{order.order_number}</h3>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        {order.channel && (
                          <Badge variant="outline" className="text-xs">
                            {order.channel.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {order.customer_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(order.order_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {order.currency_code} {order.total_amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <RippleButton
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </RippleButton>
                      <RippleButton size="sm" variant="outline">
                        <Printer className="h-4 w-4" />
                      </RippleButton>
                    </div>
                  </div>

                  {/* Lifecycle Progress */}
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      {LIFECYCLE_STAGES.map((stage, idx) => {
                        const currentStage = getCurrentStage(order);
                        const isComplete = idx <= currentStage;
                        const isCurrent = idx === currentStage;
                        const Icon = stage.icon;

                        return (
                          <div key={stage.key} className="flex-1 relative">
                            <div className="flex flex-col items-center">
                              <div
                                className={`
                                  w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all
                                  ${isComplete 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted text-muted-foreground'
                                  }
                                  ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}
                                `}
                              >
                                <Icon className="h-5 w-5" />
                              </div>
                              <span className={`text-xs mt-2 font-medium ${isComplete ? 'text-primary' : 'text-muted-foreground'}`}>
                                {stage.label}
                              </span>
                            </div>
                            {idx < LIFECYCLE_STAGES.length - 1 && (
                              <div
                                className={`
                                  absolute top-5 left-1/2 w-full h-0.5 transition-all
                                  ${isComplete ? 'bg-primary' : 'bg-muted'}
                                `}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    {order.status !== "delivered" && order.status !== "cancelled" && (
                      <>
                        {order.status === "received" && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(order.id, "confirmed")}
                          >
                            Confirm Order
                          </Button>
                        )}
                        {order.status === "confirmed" && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(order.id, "picked")}
                          >
                            Mark as Picked
                          </Button>
                        )}
                        {order.status === "picked" && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(order.id, "packed")}
                          >
                            Mark as Packed
                          </Button>
                        )}
                        {order.status === "packed" && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(order.id, "shipped")}
                          >
                            Ship Order
                          </Button>
                        )}
                        {order.status === "shipped" && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(order.id, "delivered")}
                          >
                            Mark as Delivered
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredOrders.length === 0 && (
          <Card className="card-premium p-12 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground">Orders will appear here once they're created</p>
          </Card>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-semibold mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedOrder.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedOrder.customer_email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedOrder.customer_phone}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Info */}
              <div>
                <h3 className="font-semibold mb-3">Shipping Address</h3>
                <div className="text-sm space-y-1">
                  <p>{selectedOrder.shipping_address}</p>
                  <p>{selectedOrder.shipping_city}, {selectedOrder.shipping_state}</p>
                  {selectedOrder.tracking_number && (
                    <p className="pt-2 font-medium">
                      Tracking: {selectedOrder.tracking_number}
                      {selectedOrder.carrier && ` (${selectedOrder.carrier})`}
                    </p>
                  )}
                </div>
              </div>

              {/* Order Timeline */}
              <div>
                <h3 className="font-semibold mb-3">Order Timeline</h3>
                <div className="space-y-2 text-sm">
                  {selectedOrder.order_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Received:</span>
                      <span>{new Date(selectedOrder.order_date).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedOrder.confirmed_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confirmed:</span>
                      <span>{new Date(selectedOrder.confirmed_at).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedOrder.picked_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Picked:</span>
                      <span>{new Date(selectedOrder.picked_at).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedOrder.packed_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Packed:</span>
                      <span>{new Date(selectedOrder.packed_at).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedOrder.shipped_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipped:</span>
                      <span>{new Date(selectedOrder.shipped_at).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedOrder.delivered_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivered:</span>
                      <span>{new Date(selectedOrder.delivered_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
