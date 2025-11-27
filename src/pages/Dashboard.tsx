import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Package, TrendingUp, AlertCircle, ShoppingCart, Loader2, Database, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { InventoryTrendChart, CategoryDistributionChart, StockStatusChart } from "@/components/Charts";

interface StatDescriptor { 
  title: string; 
  value: string; 
  numericValue?: number;
  change?: string; 
  trend?: 'up' | 'down' | 'neutral';
  icon: any; 
  color: string; 
  bgColor: string; 
}

// Animated Counter Component
const AnimatedCounter = ({ value, delay = 0 }: { value: number; delay?: number }) => {
  const spring = useSpring(0, { duration: 1500, bounce: 0 });
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      spring.set(value);
    }, delay);
    return () => clearTimeout(timeout);
  }, [spring, value, delay]);
  
  return <motion.span>{display}</motion.span>;
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatDescriptor[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [dbNotSetup, setDbNotSetup] = useState(false);
  const [chartData, setChartData] = useState({
    trends: [] as Array<{ date: string; items: number; value: number }>,
    categories: [] as Array<{ name: string; value: number }>,
    stockStatus: { healthy: 0, low: 0, out: 0 },
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      
      // Timeout fallback to prevent infinite loading
      const timeout = setTimeout(() => {
        setLoading(false);
        setStats([
          { title: 'Total Items', value: '0', numericValue: 0, trend: 'neutral', icon: Package, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10' },
          { title: 'Inventory Value', value: '$0.00', numericValue: 0, trend: 'neutral', icon: TrendingUp, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-500/10' },
          { title: 'Low Stock Items', value: '0', numericValue: 0, trend: 'neutral', icon: AlertCircle, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-500/10' },
          { title: 'Pending Orders', value: '0', numericValue: 0, trend: 'neutral', icon: ShoppingCart, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-500/10' },
        ]);
      }, 5000); // 5 second timeout

      try {
        // Fetch inventory items
        const { data: inv, error: invErr } = await supabase
          .from('inventory')
          .select('id, name, quantity, price, min_quantity, created_at')
          .order('created_at', { ascending: false });
        
        if (invErr) {
          // Handle table not found (404) gracefully
          if (invErr.code === 'PGRST116' || invErr.message?.includes('404')) {
            console.warn('Tables not created yet. Please run supabase-schema.sql');
            throw new Error('DATABASE_NOT_SETUP');
          }
          throw invErr;
        }

        const totalItems = inv?.length || 0;
        const inventoryValue = inv?.reduce((sum, item: any) => sum + (item.price || 0) * (item.quantity || 0), 0) || 0;
        const lowStock = inv?.filter(i => i.quantity <= (i.min_quantity ?? 5)).length || 0;

        // Purchase orders pending
        const { data: po, error: poErr } = await supabase
          .from('purchase_orders')
          .select('id, status')
          .eq('status', 'pending');
        
        const pendingOrders = (poErr && poErr.code !== 'PGRST116') ? 0 : (po?.length || 0);

        clearTimeout(timeout);
        setStats([
          { 
            title: 'Total Items', 
            value: String(totalItems), 
            numericValue: totalItems,
            trend: totalItems > 0 ? 'up' : 'neutral',
            icon: Package, 
            color: 'text-blue-600 dark:text-blue-400', 
            bgColor: 'bg-blue-500/10' 
          },
          { 
            title: 'Inventory Value', 
            value: `$${inventoryValue.toFixed(2)}`, 
            numericValue: inventoryValue,
            trend: inventoryValue > 0 ? 'up' : 'neutral',
            icon: TrendingUp, 
            color: 'text-green-600 dark:text-green-400', 
            bgColor: 'bg-green-500/10' 
          },
          { 
            title: 'Low Stock Items', 
            value: String(lowStock), 
            numericValue: lowStock,
            trend: lowStock > 0 ? 'down' : 'neutral',
            icon: AlertCircle, 
            color: 'text-orange-600 dark:text-orange-400', 
            bgColor: 'bg-orange-500/10' 
          },
          { 
            title: 'Pending Orders', 
            value: String(pendingOrders), 
            numericValue: pendingOrders,
            trend: pendingOrders > 0 ? 'up' : 'neutral',
            icon: ShoppingCart, 
            color: 'text-purple-600 dark:text-purple-400', 
            bgColor: 'bg-purple-500/10' 
          },
        ]);
        setRecent(inv?.slice(0, 5) || []);

        // Prepare chart data
        // Trend data (last 7 days simulation)
        const trendData = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          // Simulate gradual growth
          const itemCount = Math.max(0, totalItems - Math.floor(Math.random() * 5));
          const valueCount = Math.max(0, inventoryValue - Math.floor(Math.random() * inventoryValue * 0.2));
          trendData.push({ date: dateStr, items: itemCount, value: Math.round(valueCount) });
        }

        // Category distribution
        const categoryMap = new Map<string, number>();
        inv?.forEach((item: any) => {
          const cat = item.category || 'Uncategorized';
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
        });
        const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));

        // Stock status
        const healthy = inv?.filter(i => i.quantity > (i.min_quantity ?? 5)).length || 0;
        const stockStatusData = { healthy, low: lowStock, out: totalItems - healthy - lowStock };

        setChartData({
          trends: trendData,
          categories: categoryData,
          stockStatus: stockStatusData,
        });
      } catch (e: any) {
        console.error('Dashboard load error:', e);
        clearTimeout(timeout);
        
        // Show helpful message if database not set up
        const isDbNotSetup = e.message === 'DATABASE_NOT_SETUP' || e.message?.includes('404');
        
        setStats([
          { title: 'Total Items', value: isDbNotSetup ? '⚠️' : '—', numericValue: 0, trend: 'neutral', icon: Package, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10' },
          { title: 'Inventory Value', value: isDbNotSetup ? '⚠️' : '—', numericValue: 0, trend: 'neutral', icon: TrendingUp, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-500/10' },
          { title: 'Low Stock Items', value: isDbNotSetup ? '⚠️' : '—', numericValue: 0, trend: 'neutral', icon: AlertCircle, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-500/10' },
          { title: 'Pending Orders', value: isDbNotSetup ? '⚠️' : '—', numericValue: 0, trend: 'neutral', icon: ShoppingCart, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-500/10' },
        ]);
        
        if (isDbNotSetup) {
          setRecent([{
            id: 'setup',
            name: '⚠️ Database Setup Required',
            quantity: 0,
            created_at: new Date().toISOString()
          }]);
          setDbNotSetup(true);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-2"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-gradient-hero">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-body">
            Welcome back! Here's your inventory overview.
          </p>
        </motion.div>

        {/* Database Setup Alert */}
        {dbNotSetup && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
              <Database className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertTitle className="text-orange-900 dark:text-orange-300">Database Setup Required</AlertTitle>
              <AlertDescription className="text-orange-800 dark:text-orange-400">
                Your database tables haven't been created yet. Please open <code className="px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/40 text-xs font-mono">supabase-schema.sql</code> and run it in your Supabase SQL Editor.
                <br />
                <a 
                  href="https://supabase.com/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline font-medium mt-1 inline-block hover:text-orange-950 dark:hover:text-orange-200"
                >
                  Go to Supabase Dashboard →
                </a>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const TrendIcon = stat.trend === 'up' ? ArrowUpRight : stat.trend === 'down' ? ArrowDownRight : Minus;
            const trendColor = stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : stat.trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-gray-500';
            
            return (
              <motion.div key={stat.title} variants={itemVariants}>
                <Card className="stat-card-premium group relative overflow-hidden border-t-4 border-t-transparent hover:border-t-primary/30 transition-all duration-300 p-3 sm:p-4 md:p-6">
                  {/* Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      {stat.title}
                      {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                    </CardTitle>
                    <motion.div 
                      className={`${stat.bgColor} p-3 rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-110`}
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </motion.div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="flex items-baseline justify-between">
                      <div className="text-3xl font-display font-bold numeric tabular-nums">
                        {!loading && stat.numericValue !== undefined ? (
                          stat.title === 'Inventory Value' ? (
                            <span>
                              $<AnimatedCounter value={stat.numericValue} delay={index * 100} />
                            </span>
                          ) : (
                            <AnimatedCounter value={stat.numericValue} delay={index * 100} />
                          )
                        ) : (
                          stat.value
                        )}
                      </div>
                      {!loading && stat.trend && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 + index * 0.1, type: "spring", stiffness: 200 }}
                        >
                          <Badge variant="outline" className={`${trendColor} border-current gap-1`}>
                            <TrendIcon className="h-3 w-3" />
                            <span className="text-xs font-medium">
                              {stat.trend === 'up' ? 'Active' : stat.trend === 'down' ? 'Alert' : 'Stable'}
                            </span>
                          </Badge>
                        </motion.div>
                      )}
                    </div>
                    {/* Micro chart placeholder */}
                    <div className="mt-3 h-8 flex items-end gap-1 opacity-40">
                      {[...Array(12)].map((_, i) => (
                        <motion.div
                          key={i}
                          className={`flex-1 ${stat.bgColor} rounded-t`}
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.random() * 100}%` }}
                          transition={{ delay: 0.7 + index * 0.1 + i * 0.05, duration: 0.5 }}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Charts Section */}
        {!dbNotSetup && !loading && chartData.categories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 overflow-x-auto">
            <div className="md:col-span-2">
              <InventoryTrendChart data={chartData.trends} />
            </div>
            <StockStatusChart data={chartData.stockStatus} />
            <div className="md:col-span-3">
              <CategoryDistributionChart data={chartData.categories} />
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Card className="card-glass border-0 shadow-2xl p-2 sm:p-4 md:p-6">
            <CardHeader className="border-b border-border/40 bg-gradient-to-r from-background via-accent/30 to-background">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <div>
                  <CardTitle className="font-display text-lg sm:text-xl flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Recent Items
                  </CardTitle>
                  <CardDescription className="mt-1">Latest additions to your inventory</CardDescription>
                </div>
                {!loading && recent.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {recent.length} items
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6">
              <div className="space-y-3">
                {loading && (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="skeleton h-16 rounded-lg" />
                    ))}
                  </div>
                )}
                {!loading && recent.length === 0 && (
                  <div className="text-center py-8 sm:py-12">
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted mb-4">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No items found in your inventory yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">Add your first item to get started!</p>
                  </div>
                )}
                {!loading && recent.map((item: any, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.05 }}
                    className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
                  >
                    {/* Hover gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
                    
                    <div className="flex items-center gap-4 relative z-10">
                      <motion.div 
                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-md group-hover:shadow-primary/20 transition-shadow"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Package className="h-6 w-6 text-primary" />
                      </motion.div>
                      <div>
                        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">Qty: {item.quantity}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="relative z-10 flex items-center gap-3 mt-2 sm:mt-0">
                      <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">#{item.id}</span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
