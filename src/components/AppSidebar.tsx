import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Settings,
  ChevronDown,
  Plus,
  List,
  TrendingUp,
  FileText,
  CreditCard,
  RotateCcw,
  Truck,
  UserCheck,
  ShoppingBag,
  PackageOpen
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabaseClient";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Inventory",
    icon: Package,
    items: [
      { title: "All Items", url: "/inventory", icon: List },
      { title: "Add Item", url: "/inventory/add", icon: Plus },
      { title: "Low Stock", url: "/inventory/low-stock", icon: TrendingUp },
    ],
  },
  {
    title: "Sales & Invoicing",
    icon: FileText,
    items: [
      { title: "Invoices", url: "/invoices", icon: FileText },
      { title: "Customers", url: "/customers", icon: UserCheck },
      { title: "Credit Notes", url: "/credit-notes", icon: CreditCard },
      { title: "Sales Returns", url: "/sales-returns", icon: RotateCcw },
      { title: "Backorders", url: "/backorders", icon: Truck },
    ],
  },
  {
    title: "Omnichannel",
    icon: ShoppingBag,
    items: [
      { title: "Channels", url: "/channels", icon: ShoppingBag },
      { title: "Orders", url: "/orders", icon: PackageOpen },
      { title: "Returns", url: "/returns", icon: RotateCcw },
    ],
  },
  {
    title: "Suppliers",
    url: "/suppliers",
    icon: Users,
  },
  {
    title: "Purchase Orders",
    url: "/purchase-orders",
    icon: ShoppingCart,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const [expandedSections, setExpandedSections] = useState<string[]>(["Inventory", "Sales & Invoicing", "Omnichannel"]);
    const [companyName, setCompanyName] = useState("digistock");

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('app_settings')
        .select('business_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.business_name) {
        setCompanyName(data.business_name);
      }
    } catch (err) {
      console.warn('Failed to load company name:', err);
    }
  };

  useEffect(() => {
    loadSettings();

    // Subscribe to settings changes for real-time updates
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('app_settings_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'app_settings',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Settings change detected:', payload);
            if (payload.new && (payload.new as any).business_name) {
              setCompanyName((payload.new as any).business_name);
            }
          }
        )
        .subscribe();

      return channel;
    };

    const channelPromise = setupSubscription();

    // Reload settings when window regains focus
    const handleFocus = () => {
      loadSettings();
    };
    window.addEventListener('focus', handleFocus);

    // Also listen for a custom event from Settings page
    const handleSettingsUpdate = () => {
      loadSettings();
    };
    window.addEventListener('settings-updated', handleSettingsUpdate);

    return () => {
      channelPromise.then(channel => {
        if (channel) supabase.removeChannel(channel);
      });
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('settings-updated', handleSettingsUpdate);
    };
  }, []);

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border bg-gradient-to-br from-background to-muted/20">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-5"
        >
          {/* Enhanced Logo with 3D effect */}
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative h-10 w-10 rounded-xl bg-gradient-hero flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
          >
            {/* Animated glow effect */}
            <motion.div
              className="absolute inset-0 rounded-xl bg-primary/20 blur-xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <Package className="h-5 w-5 text-white relative z-10" strokeWidth={2.5} />
          </motion.div>
          
          {open && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              <motion.h2 
                className="font-display font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
                whileHover={{ scale: 1.02 }}
              >
                {companyName}
              </motion.h2>
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Real-time Management, zero compromise
              </p>
            </motion.div>
          )}
        </motion.div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/80 px-4 mb-2 font-semibold">
            {open ? "Navigation" : "Nav"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item, index) => {
                if (item.items) {
                  const isExpanded = expandedSections.includes(item.title);
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <SidebarMenuButton
                          onClick={() => toggleSection(item.title)}
                          className="w-full justify-between rounded-lg transition-all group hover:bg-sidebar-accent/70 hover:shadow-sm"
                          tooltip={!open ? item.title : undefined}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4 transition-all group-hover:text-primary group-hover:scale-110" />
                            {open && <span className="font-medium group-hover:text-foreground transition-colors">{item.title}</span>}
                          </div>
                          {open && (
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.3, type: "spring" }}
                            >
                              <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </motion.div>
                          )}
                        </SidebarMenuButton>

                        <AnimatePresence>
                          {isExpanded && open && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                              className="overflow-hidden"
                            >
                              <div className="ml-4 mt-1 space-y-1 border-l-2 border-sidebar-border/50 pl-4 relative before:absolute before:left-0 before:top-0 before:h-full before:w-0.5 before:bg-primary/20">
                                {item.items.map((subItem, subIndex) => {
                                  const SubIcon = subItem.icon;
                                  return (
                                    <motion.div
                                      key={subItem.url}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ duration: 0.2, delay: subIndex * 0.05 }}
                                    >
                                      <SidebarMenuButton
                                        asChild
                                      >
                                        <NavLink
                                          to={subItem.url}
                                          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all group hover:bg-sidebar-accent/60 hover:shadow-sm hover:translate-x-1"
                                        >
                                          <SubIcon className="h-4 w-4 transition-all group-hover:text-primary group-hover:scale-110" />
                                          <span className="group-hover:text-foreground transition-colors">{subItem.title}</span>
                                        </NavLink>
                                      </SidebarMenuButton>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </SidebarMenuItem>
                  );
                }

                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.url}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <SidebarMenuButton
                        asChild
                        tooltip={!open ? item.title : undefined}
                      >
                        <NavLink
                          to={item.url}
                          end
                          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                          className="flex items-center gap-3 rounded-lg transition-all group hover:bg-sidebar-accent/70 hover:shadow-sm"
                        >
                          <Icon className="h-4 w-4 transition-all group-hover:text-primary group-hover:scale-110" />
                          {open && <span className="font-medium group-hover:text-foreground transition-colors">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </motion.div>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-4 bg-gradient-to-r from-transparent via-border to-transparent" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/80 px-4 mb-2 font-semibold">
            {open ? "Quick Stats" : "Stats"}
          </SidebarGroupLabel>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mx-3 px-4 py-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 backdrop-blur-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground font-medium">Total Items</p>
                    <p className="text-sm font-bold">Coming Soon</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground/70">
                  Stats will update once you add inventory items
                </p>
              </div>
            </motion.div>
          )}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 p-4 bg-gradient-to-br from-muted/20 to-background">
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            {/* Version Badge */}
            <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold text-primary">digistock v1.0.0</span>
            </div>
            
            {/* Footer Links */}
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
              <motion.a
                href="#"
                whileHover={{ scale: 1.05, color: "hsl(var(--primary))" }}
                className="hover:text-primary transition-colors"
              >
                Help
              </motion.a>
              <span>•</span>
              <motion.a
                href="#"
                whileHover={{ scale: 1.05, color: "hsl(var(--primary))" }}
                className="hover:text-primary transition-colors"
              >
                Docs
              </motion.a>
            </div>
          </motion.div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
