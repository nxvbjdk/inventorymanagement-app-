import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Package, Loader2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

interface LowItem { id: number; name: string; quantity: number; min_quantity?: number; category?: string; }

const InventoryLowStock = () => {
  const [items, setItems] = useState<LowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const { data, error } = await supabase.from('inventory').select('id, name, quantity, min_quantity, category');
        if (error) throw error;
        const low = (data || []).filter(i => i.quantity <= (i.min_quantity ?? 5));
        // Sort by urgency (difference ascending)
        low.sort((a,b) => (a.quantity - (a.min_quantity ?? 5)) - (b.quantity - (b.min_quantity ?? 5)));
        setItems(low);
      } catch (e:any) {
        setError(e.message || 'Failed to load low stock items');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto p-6 space-y-6">
        <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} className="space-y-2">
          <h1 className="text-4xl font-display font-bold text-gradient-hero">Low Stock Items</h1>
          <p className="text-muted-foreground text-body">Items nearing or below minimum threshold</p>
        </motion.div>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" /> Inventory Attention</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-12 justify-center"><Loader2 className="h-5 w-5 animate-spin" /> Loading...</div>
              )}
              {error && !loading && (<div className="text-red-600 text-sm py-4">{error}</div>)}
              {!loading && !error && items.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="mb-2">All items are adequately stocked.</p>
                </div>
              )}
              {!loading && items.length > 0 && (
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity:0, y:10 }}
                      animate={{ opacity:1, y:0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-accent/60 hover:bg-accent transition-smooth"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-warning/15 flex items-center justify-center">
                          <Package className="h-5 w-5 text-warning" />
                        </div>
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Qty {item.quantity} / Min {(item.min_quantity ?? 5)} {item.category ? `• ${item.category}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => window.location.href='/inventory/add'}>Reorder</Button>
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => window.location.href='/suppliers'}>
                          Suppliers <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default InventoryLowStock;
