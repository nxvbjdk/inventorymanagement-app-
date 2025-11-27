import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster as PremiumToaster } from "@/components/ui/premium-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider, useTheme } from "next-themes";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import InventoryAdd from "./pages/InventoryAdd";
import InventoryBarcode from "./pages/InventoryBarcode";
import InventoryLowStock from "./pages/InventoryLowStock";
import Suppliers from "./pages/Suppliers";
import PurchaseOrders from "./pages/PurchaseOrders";
import Invoices from "./pages/Invoices";
import Customers from "./pages/Customers";
import CreditNotes from "./pages/CreditNotes";
import SalesReturns from "./pages/SalesReturns";
import Channels from "./pages/Channels";
import Orders from "./pages/Orders";
import ReturnsPage from "./pages/ReturnsPage";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PasswordReset from "./pages/PasswordReset";
import VerifyEmail from "./pages/VerifyEmail";
import { supabase } from "@/lib/supabaseClient";

interface AppSettingsRow {
  accent_color?: string; // hex
  theme_mode?: 'light' | 'dark' | 'system';
}

// Component that runs once to apply global settings (theme + accent color)
const SettingsApplier = () => {
  const { setTheme } = useTheme();

  useEffect(() => {
    const applySettings = (data: any) => {
      if (!data) return;
      
      // Theme mode
      if (data.theme_mode && data.theme_mode !== 'system') {
        setTheme(data.theme_mode);
      }
      
      // Accent color mapping -> update CSS variables for primary brand
      if (data.accent_color) {
        const hsl = hexToHSL(data.accent_color);
        if (hsl) {
          const { h, s, l } = hsl;
          const root = document.documentElement;
          root.style.setProperty('--primary', `${h} ${s}% ${l}%`);
          root.style.setProperty('--primary-dark', `${h} ${s}% ${Math.max(0, l - 10)}%`);
          root.style.setProperty('--primary-glow', `${h} ${s}% ${Math.min(95, l + 10)}%`);
          root.style.setProperty('--gradient-primary', `linear-gradient(135deg, hsl(${h} ${s}% ${l}%), hsl(${h} ${s}% ${Math.min(95, l + 8)}%))`);
          root.style.setProperty('--gradient-hero', `linear-gradient(135deg, hsl(${h} ${s}% ${l}%) 0%, hsl(var(--secondary)) 100%)`);
        }
      }
    };

    const apply = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("app_settings")
          .select("accent_color, theme_mode")
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116') throw error;
        applySettings(data);
      } catch (e) {
        console.warn('Could not apply settings', e);
      }
    };
    
    apply();

    // Subscribe to real-time settings changes
    const channel = supabase
      .channel('settings_theme_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_settings'
        },
        (payload) => {
          if (payload.new) {
            applySettings(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setTheme]);

  return null;
};

// Convert HEX (#rrggbb) to HSL components
function hexToHSL(hex: string): { h: number; s: number; l: number } | null {
  const clean = hex.replace('#','');
  if (clean.length !== 6) return null;
  const r = parseInt(clean.substring(0,2),16) / 255;
  const g = parseInt(clean.substring(2,4),16) / 255;
  const b = parseInt(clean.substring(4,6),16) / 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, s = 0; const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100) };
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SettingsApplier />
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PremiumToaster />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <SidebarProvider>
            <AppShell />
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

// Header component extracting auth logic
const HeaderBar = () => {
  const { user, signOut, profile } = useAuth();
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger />
      <div className="flex-1" />
      {user && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {profile?.user_role && (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              profile.user_role === 'owner' 
                ? 'bg-primary/10 text-primary border border-primary/20' 
                : 'bg-muted text-muted-foreground border border-border'
            }`}>
              {profile.user_role === 'owner' ? '👑 Owner' : '👁 Viewer'}
            </span>
          )}
          <span>{user.email}</span>
          <button
            onClick={() => signOut()}
            className="px-3 py-1 rounded-md text-xs bg-muted hover:bg-accent transition-colors"
          >Sign Out</button>
        </div>
      )}
      <ThemeToggle />
    </header>
  );
};

// Wrap App with AuthProvider externally (export a root component)
export const RootApp = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

// Shell that hides sidebar/header on auth pages
const AppShell = () => {
  const location = useLocation();
  const authPages = ["/login", "/register", "/reset", "/verify-email"];
  const hideChrome = authPages.includes(location.pathname);
  if (hideChrome) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden">
        <main className="flex-1 w-full overflow-x-hidden">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset" element={<PasswordReset />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="*" element={<Login />} />
          </Routes>
        </main>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <AppSidebar />
      <SidebarInset className="flex-1 w-full overflow-x-hidden">
        <HeaderBar />
        <main className="flex-1 w-full overflow-x-hidden">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset" element={<PasswordReset />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="/inventory/add" element={<ProtectedRoute><InventoryAdd /></ProtectedRoute>} />
            <Route path="/inventory/barcode" element={<ProtectedRoute><InventoryBarcode /></ProtectedRoute>} />
            <Route path="/inventory/low-stock" element={<ProtectedRoute><InventoryLowStock /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="/credit-notes" element={<ProtectedRoute><CreditNotes /></ProtectedRoute>} />
            <Route path="/sales-returns" element={<ProtectedRoute><SalesReturns /></ProtectedRoute>} />
            <Route path="/channels" element={<ProtectedRoute><Channels /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/returns" element={<ProtectedRoute><ReturnsPage /></ProtectedRoute>} />
            <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
            <Route path="/purchase-orders" element={<ProtectedRoute><PurchaseOrders /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </SidebarInset>
    </div>
  );
};
