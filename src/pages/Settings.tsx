import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings as SettingsIcon, Loader2, Palette, Bell, Save, RefreshCcw, Sun, Moon, CheckCircle2, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { pageTransition, fadeIn, staggerContainer, staggerItem } from "@/lib/animations";

interface AppSettings {
  business_name: string;
  default_currency: string;
  low_stock_threshold: number;
  timezone: string;
  date_format: string;
  theme_mode: "light" | "dark" | "system";
  accent_color: string;
  density: "comfortable" | "compact";
  notify_low_stock: boolean;
  notify_supplier_status: boolean;
  notify_po_updates: boolean;
  notify_daily_summary: boolean;
  auto_refresh_interval: number;
  decimal_places: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  business_name: "",
  default_currency: "USD",
  low_stock_threshold: 10,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  date_format: "MM/DD/YYYY",
  theme_mode: "system",
  accent_color: "#3b82f6",
  density: "comfortable",
  notify_low_stock: true,
  notify_supplier_status: true,
  notify_po_updates: true,
  notify_daily_summary: false,
  auto_refresh_interval: 5,
  decimal_places: 2,
};

const accentColors = ["#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b", "#10b981", "#0d9488"];

// NOTE: Expects a Supabase table `app_settings` with columns matching AppSettings, plus id (uuid), created_at.
// If user-specific settings desired, add a user_id column and filter accordingly.

const Settings = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error && error.code !== "PGRST116") throw error;
      if (data) {
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      }
    } catch (e) {
      console.error("Failed to fetch settings", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from("app_settings")
        .upsert(
          { user_id: user.id, ...settings },
          { onConflict: "user_id" }
        );
      
      if (error) throw error;
      setSuccessMessage("Settings saved successfully!");
      
      // Apply theme changes immediately
      if (settings.theme_mode !== 'system') {
        document.documentElement.classList.toggle('dark', settings.theme_mode === 'dark');
      }

      // Dispatch custom event to notify other components (like sidebar)
      window.dispatchEvent(new Event('settings-updated'));
    } catch (e: any) {
      alert("Error saving settings: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const isCompact = settings.density === "compact";

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const applyThemeImmediately = (mode: "light" | "dark" | "system") => {
    if (mode === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', systemPrefersDark);
    } else {
      document.documentElement.classList.toggle('dark', mode === 'dark');
    }
  };

  const applyAccentColorImmediately = (color: string) => {
    const hexToHSL = (hex: string): { h: number; s: number; l: number } | null => {
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
    };

    const hsl = hexToHSL(color);
    if (hsl) {
      const { h, s, l } = hsl;
      const root = document.documentElement;
      root.style.setProperty('--primary', `${h} ${s}% ${l}%`);
      root.style.setProperty('--primary-dark', `${h} ${s}% ${Math.max(0, l - 10)}%`);
      root.style.setProperty('--primary-glow', `${h} ${s}% ${Math.min(95, l + 10)}%`);
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-mesh"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <AnimatePresence mode="wait">
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-gradient-to-r from-green-500/10 to-green-600/10 backdrop-blur-sm border border-green-500/20 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl shadow-lg"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
                >
                  <CheckCircle2 className="h-5 w-5" />
                </motion.div>
                <span className="font-medium">{successMessage}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="p-3 rounded-2xl bg-gradient-hero shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <SettingsIcon className="h-7 w-7 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground text-sm md:text-base">Manage your application preferences</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="general" className="data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
                <Building2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">General</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
                <Palette className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Appearance</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
                <Bell className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="data" className="data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
                <RefreshCcw className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Data</span>
              </TabsTrigger>
            </TabsList>

            {/* General */}
            <TabsContent value="general">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="card-elevated border-border/50">
                  <CardHeader>
                    <CardTitle className="font-display flex items-center gap-2 text-xl">
                      <Building2 className="h-5 w-5 text-primary" /> 
                      General Settings
                    </CardTitle>
                    <CardDescription>Business details and core configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {loading ? (
                      <div className="flex items-center gap-3 text-muted-foreground py-8">
                        <Loader2 className="h-5 w-5 animate-spin" /> 
                        <span>Loading settings...</span>
                      </div>
                    ) : (
                      <motion.div 
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                        className={`grid gap-6 ${isCompact ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}
                      >
                        <motion.div variants={staggerItem} className="space-y-2">
                          <label className="text-sm font-semibold text-foreground">Business Name</label>
                          <Input 
                            placeholder="Your company name" 
                            value={settings.business_name} 
                            onChange={e => handleChange('business_name', e.target.value)}
                            className="input-premium transition-all duration-300"
                          />
                        </motion.div>
                        <motion.div variants={staggerItem} className="space-y-2">
                          <label className="text-sm font-semibold text-foreground">Default Currency</label>
                          <select 
                            value={settings.default_currency} 
                            onChange={e => handleChange('default_currency', e.target.value)} 
                            className="w-full px-3 py-2 h-11 rounded-md border border-input bg-background text-foreground transition-all duration-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            {['USD','EUR','GBP','CAD','AUD','JPY','INR'].map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </motion.div>
                        <motion.div variants={staggerItem} className="space-y-2">
                          <label className="text-sm font-semibold text-foreground">Low Stock Threshold</label>
                          <Input 
                            type="number" 
                            value={settings.low_stock_threshold} 
                            onChange={e => handleChange('low_stock_threshold', parseInt(e.target.value) || 0)}
                            className="input-premium"
                          />
                          <p className="text-xs text-muted-foreground">Alert when stock falls below this number</p>
                        </motion.div>
                        <motion.div variants={staggerItem} className="space-y-2">
                          <label className="text-sm font-semibold text-foreground">Timezone</label>
                          <Input 
                            value={settings.timezone} 
                            onChange={e => handleChange('timezone', e.target.value)}
                            className="input-premium font-mono text-sm"
                          />
                        </motion.div>
                        <motion.div variants={staggerItem} className="space-y-2">
                          <label className="text-sm font-semibold text-foreground">Date Format</label>
                          <select 
                            value={settings.date_format} 
                            onChange={e => handleChange('date_format', e.target.value)} 
                            className="w-full px-3 py-2 h-11 rounded-md border border-input bg-background text-foreground transition-all duration-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            {['MM/DD/YYYY','DD/MM/YYYY','YYYY-MM-DD'].map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </motion.div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Appearance */}
            <TabsContent value="appearance">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="card-elevated border-border/50">
                  <CardHeader>
                    <CardTitle className="font-display flex items-center gap-2 text-xl">
                      <Palette className="h-5 w-5 text-primary" /> 
                      Appearance
                    </CardTitle>
                    <CardDescription>Customize theme, colors, and interface density</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {loading ? (
                      <div className="flex items-center gap-3 text-muted-foreground py-8">
                        <Loader2 className="h-5 w-5 animate-spin" /> 
                        <span>Loading settings...</span>
                      </div>
                    ) : (
                      <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                        className="space-y-8"
                      >
                        {/* Theme Mode */}
                        <motion.div variants={staggerItem} className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold">Theme Mode</label>
                            <Badge variant="outline" className="text-xs">Live Preview</Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {(['light', 'dark', 'system'] as const).map((mode) => (
                              <motion.button
                                key={mode}
                                type="button"
                                whileHover={{ scale: 1.03, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  handleChange('theme_mode', mode);
                                  applyThemeImmediately(mode);
                                }}
                                className={`relative p-5 rounded-xl border-2 transition-all ${
                                  settings.theme_mode === mode
                                    ? 'border-primary bg-primary/10 shadow-lg'
                                    : 'border-border hover:border-primary/50 bg-card hover:shadow-md'
                                }`}
                              >
                                <div className="flex flex-col items-center gap-3">
                                  <div className={`p-3 rounded-lg ${settings.theme_mode === mode ? 'bg-primary/20' : 'bg-muted'} transition-colors`}>
                                    {mode === 'light' && <Sun className="h-6 w-6 text-primary" />}
                                    {mode === 'dark' && <Moon className="h-6 w-6 text-primary" />}
                                    {mode === 'system' && (
                                      <div className="relative h-6 w-6">
                                        <Sun className="h-6 w-6 absolute text-primary" style={{ clipPath: 'inset(0 50% 0 0)' }} />
                                        <Moon className="h-6 w-6 absolute text-primary" style={{ clipPath: 'inset(0 0 0 50%)' }} />
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-sm font-semibold capitalize">{mode}</span>
                                </div>
                                {settings.theme_mode === mode && (
                                  <motion.div
                                    layoutId="theme-indicator"
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-lg"
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                  >
                                    <svg className="h-4 w-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </motion.div>
                                )}
                              </motion.button>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Changes apply immediately. Click Save to persist.
                          </p>
                        </motion.div>

                        {/* Accent Color */}
                        <motion.div variants={staggerItem} className="space-y-4">
                          <label className="text-sm font-semibold">Accent Color</label>
                          <div className="flex flex-wrap gap-3">
                            {accentColors.map((color, idx) => (
                              <motion.button
                                key={color}
                                type="button"
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05, type: "spring", stiffness: 300 }}
                                whileHover={{ scale: 1.15, rotate: 5 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  handleChange('accent_color', color);
                                  applyAccentColorImmediately(color);
                                }}
                                className={`relative h-14 w-14 rounded-xl transition-all shadow-md hover:shadow-xl ${
                                  settings.accent_color === color 
                                    ? 'ring-4 ring-offset-4 ring-offset-background scale-110' 
                                    : 'hover:ring-2 hover:ring-offset-2 hover:ring-offset-background'
                                }`}
                                style={{ 
                                  backgroundColor: color,
                                  ringColor: settings.accent_color === color ? color : undefined
                                }}
                              >
                                <AnimatePresence>
                                  {settings.accent_color === color && (
                                    <motion.div
                                      initial={{ scale: 0, rotate: -180 }}
                                      animate={{ scale: 1, rotate: 0 }}
                                      exit={{ scale: 0, rotate: 180 }}
                                      transition={{ type: "spring", stiffness: 300 }}
                                      className="absolute inset-0 flex items-center justify-center"
                                    >
                                      <svg className="h-7 w-7 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.button>
                            ))}
                          </div>
                          <div className="flex items-center gap-3 pt-2 p-4 rounded-lg border border-border/50 bg-muted/30">
                            <Input 
                              type="color" 
                              value={settings.accent_color}
                              onChange={(e) => {
                                handleChange('accent_color', e.target.value);
                                applyAccentColorImmediately(e.target.value);
                              }}
                              className="h-14 w-20 cursor-pointer border-2 border-border shadow-md"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-foreground">Custom Color</p>
                              <p className="text-xs font-mono text-muted-foreground">{settings.accent_color.toUpperCase()}</p>
                            </div>
                          </div>
                        </motion.div>

                        {/* Interface Density */}
                        <motion.div variants={staggerItem} className="space-y-4">
                          <label className="text-sm font-semibold">Interface Density</label>
                          <div className="grid grid-cols-2 gap-3">
                            {(['comfortable', 'compact'] as const).map((density) => (
                              <motion.button
                                key={density}
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleChange('density', density)}
                                className={`relative p-4 rounded-lg border-2 transition-all ${
                                  settings.density === density
                                    ? 'border-primary bg-primary/5 shadow-md'
                                    : 'border-border hover:border-primary/50 bg-card'
                                }`}
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <div className={`flex flex-col gap-1 ${density === 'compact' ? 'scale-75' : ''}`}>
                                    <div className="h-2 w-16 bg-foreground/20 rounded"></div>
                                    <div className="h-2 w-12 bg-foreground/20 rounded"></div>
                                    <div className="h-2 w-14 bg-foreground/20 rounded"></div>
                                  </div>
                                  <span className="text-sm font-medium capitalize">{density}</span>
                                </div>
                                {settings.density === density && (
                                  <motion.div
                                    layoutId="density-indicator"
                                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center"
                                  >
                                    <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </motion.div>
                                )}
                              </motion.button>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">Comfortable spacing is recommended for most users</p>
                        </motion.div>

                        {/* Preview Card */}
                        <motion.div variants={staggerItem} className="space-y-4">
                          <label className="text-sm font-semibold">Preview</label>
                          <motion.div 
                            layout
                            className="p-6 rounded-lg border-2 border-dashed border-border bg-card space-y-4"
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold">Sample Card</h3>
                              <Button size={settings.density === 'compact' ? 'sm' : 'default'} variant="default">
                                Action
                              </Button>
                            </div>
                            <p className={`text-muted-foreground ${settings.density === 'compact' ? 'text-sm' : ''}`}>
                              This is how your interface will look with the current settings applied.
                            </p>
                            <div className="flex gap-2">
                              <div className="h-8 w-8 rounded-md" style={{ backgroundColor: settings.accent_color }}></div>
                              <div className={`flex-1 space-y-2 ${settings.density === 'compact' ? 'space-y-1' : ''}`}>
                                <div className="h-2 bg-foreground/10 rounded w-full"></div>
                                <div className="h-2 bg-foreground/10 rounded w-3/4"></div>
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</CardTitle>
                  <CardDescription>Select which events trigger alerts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loading ? (
                    <div className="flex items-center gap-3 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading settings...</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="text-sm font-medium">Low Stock Alerts</p>
                          <p className="text-xs text-muted-foreground">Notify when items drop below threshold</p>
                        </div>
                        <Switch checked={settings.notify_low_stock} onCheckedChange={val => handleChange('notify_low_stock', val)} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="text-sm font-medium">Supplier Status Changes</p>
                          <p className="text-xs text-muted-foreground">Alert on supplier activation or issues</p>
                        </div>
                        <Switch checked={settings.notify_supplier_status} onCheckedChange={val => handleChange('notify_supplier_status', val)} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="text-sm font-medium">Purchase Order Updates</p>
                          <p className="text-xs text-muted-foreground">Track order status changes</p>
                        </div>
                        <Switch checked={settings.notify_po_updates} onCheckedChange={val => handleChange('notify_po_updates', val)} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="text-sm font-medium">Daily Summary Email</p>
                          <p className="text-xs text-muted-foreground">Receive a daily performance snapshot</p>
                        </div>
                        <Switch checked={settings.notify_daily_summary} onCheckedChange={val => handleChange('notify_daily_summary', val)} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Preferences */}
            <TabsContent value="data">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2"><RefreshCcw className="h-5 w-5" /> Data Preferences</CardTitle>
                  <CardDescription>Formatting & refresh behavior</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loading ? (
                    <div className="flex items-center gap-3 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading settings...</div>
                  ) : (
                    <div className={`grid gap-6 ${isCompact ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Auto Refresh Interval (mins)</label>
                        <Input type="number" value={settings.auto_refresh_interval} onChange={e => handleChange('auto_refresh_interval', parseInt(e.target.value) || 0)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Decimal Places</label>
                        <select value={settings.decimal_places} onChange={e => handleChange('decimal_places', parseInt(e.target.value) as any)} className="px-3 py-2 rounded-md border border-input bg-background text-foreground">
                          {[0,1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Save Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex justify-end"
        >
          <Button disabled={saving || loading} onClick={handleSave} className="btn-premium flex items-center gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Settings;
