import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FloatingInput } from "@/components/ui/floating-input";
import { RippleButton } from "@/components/ui/ripple-button";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, RefreshCw, ShoppingBag, Globe, Store, Smartphone, CheckCircle, XCircle, 
  AlertCircle, Activity, Zap, Settings, Trash2, Link as LinkIcon
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

interface Channel {
  id: number;
  name: string;
  type: string;
  status: string;
  sync_enabled: boolean;
  last_sync_at?: string;
  sync_frequency: number;
  created_at: string;
}

const CHANNEL_TYPES = [
  { value: "shopify", label: "Shopify", icon: "🛍️" },
  { value: "amazon", label: "Amazon", icon: "📦" },
  { value: "flipkart", label: "Flipkart", icon: "🛒" },
  { value: "myntra", label: "Myntra", icon: "👗" },
  { value: "meesho", label: "Meesho", icon: "🏪" },
  { value: "website", label: "Custom Website", icon: "🌐" },
  { value: "pos", label: "POS System", icon: "💳" }
];

const Channels = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState<Record<number, boolean>>({});

  const [formData, setFormData] = useState({
    name: "",
    type: "shopify",
    api_key: "",
    api_secret: "",
    store_url: "",
    sync_frequency: 15
  });

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const { data, error } = await supabase
        .from("channels")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setChannels(data || []);
    } catch (error: any) {
      console.error("Error loading channels:", error);
      toast.error("Failed to load channels");
    } finally {
      setLoading(false);
    }
  };

  const handleAddChannel = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("channels").insert({
        user_id: user.id,
        ...formData,
        credentials: {
          api_key: formData.api_key,
          api_secret: formData.api_secret
        }
      });

      if (error) throw error;

      toast.success(`${formData.name} connected successfully!`);
      setIsAddDialogOpen(false);
      loadChannels();
      
      // Reset form
      setFormData({
        name: "",
        type: "shopify",
        api_key: "",
        api_secret: "",
        store_url: "",
        sync_frequency: 15
      });
    } catch (error: any) {
      console.error("Error adding channel:", error);
      toast.error(error.message || "Failed to add channel");
    }
  };

  const handleToggleSync = async (channelId: number, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from("channels")
        .update({ sync_enabled: enabled })
        .eq("id", channelId);

      if (error) throw error;

      toast.success(enabled ? "Sync enabled" : "Sync disabled");
      loadChannels();
    } catch (error: any) {
      console.error("Error toggling sync:", error);
      toast.error("Failed to update sync setting");
    }
  };

  const handleSyncNow = async (channel: Channel) => {
    setIsSyncing(prev => ({ ...prev, [channel.id]: true }));
    
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { error } = await supabase
        .from("channels")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", channel.id);

      if (error) throw error;

      toast.success(`${channel.name} synced successfully!`);
      loadChannels();
    } catch (error: any) {
      console.error("Error syncing:", error);
      toast.error("Sync failed");
    } finally {
      setIsSyncing(prev => ({ ...prev, [channel.id]: false }));
    }
  };

  const handleDeleteChannel = async (channelId: number, channelName: string) => {
    if (!confirm(`Delete ${channelName}? This will remove all associated data.`)) return;

    try {
      const { error } = await supabase
        .from("channels")
        .delete()
        .eq("id", channelId);

      if (error) throw error;

      toast.success("Channel deleted successfully");
      loadChannels();
    } catch (error: any) {
      console.error("Error deleting channel:", error);
      toast.error("Failed to delete channel");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-500/10 text-green-500 border-green-500/20",
      inactive: "bg-gray-500/10 text-gray-500 border-gray-500/20",
      error: "bg-red-500/10 text-red-500 border-red-500/20"
    };
    return colors[status] || colors.inactive;
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      active: CheckCircle,
      inactive: XCircle,
      error: AlertCircle
    };
    const Icon = icons[status] || XCircle;
    return <Icon className="h-4 w-4" />;
  };

  const getChannelIcon = (type: string) => {
    const channel = CHANNEL_TYPES.find(c => c.value === type);
    return channel?.icon || "🔗";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading channels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gradient-primary">Sales Channels</h1>
          <p className="text-muted-foreground mt-1">Connect and sync inventory across platforms</p>
        </div>
        <MagneticButton
          strength={0.2}
          size="lg"
          className="gap-2 premium-shadow w-full sm:w-auto"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Channel
        </MagneticButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-premium p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Channels</p>
              <p className="text-2xl font-bold mt-1">{channels.length}</p>
            </div>
            <LinkIcon className="h-8 w-8 text-primary/60" />
          </div>
        </Card>
        <Card className="card-premium p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold mt-1">{channels.filter(c => c.status === 'active').length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500/60" />
          </div>
        </Card>
        <Card className="card-premium p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Sync Enabled</p>
              <p className="text-2xl font-bold mt-1">{channels.filter(c => c.sync_enabled).length}</p>
            </div>
            <Zap className="h-8 w-8 text-blue-500/60" />
          </div>
        </Card>
        <Card className="card-premium p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Errors</p>
              <p className="text-2xl font-bold mt-1">{channels.filter(c => c.status === 'error').length}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500/60" />
          </div>
        </Card>
      </div>

      {/* Channels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <AnimatePresence>
          {channels.map((channel, index) => (
            <motion.div
              key={channel.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="card-premium p-3 sm:p-4 md:p-6 hover:shadow-xl transition-shadow">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{getChannelIcon(channel.type)}</div>
                      <div>
                        <h3 className="font-semibold text-lg">{channel.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{channel.type}</p>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(channel.status)} flex items-center gap-1`}>
                      {getStatusIcon(channel.status)}
                      {channel.status}
                    </Badge>
                  </div>

                  {/* Sync Status */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Auto Sync</span>
                      <Switch
                        checked={channel.sync_enabled}
                        onCheckedChange={(checked) => handleToggleSync(channel.id, checked)}
                      />
                    </div>
                    {channel.last_sync_at && (
                      <div className="text-xs text-muted-foreground">
                        Last synced: {new Date(channel.last_sync_at).toLocaleString()}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Sync frequency: Every {channel.sync_frequency} minutes
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                    <RippleButton
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleSyncNow(channel)}
                      disabled={isSyncing[channel.id]}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing[channel.id] ? 'animate-spin' : ''}`} />
                      {isSyncing[channel.id] ? 'Syncing...' : 'Sync Now'}
                    </RippleButton>
                    <RippleButton size="sm" variant="outline">
                      <Settings className="h-4 w-4" />
                    </RippleButton>
                    <RippleButton
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={() => handleDeleteChannel(channel.id, channel.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </RippleButton>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {channels.length === 0 && (
          <div className="col-span-full text-center py-8 sm:py-12">
            <Store className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">No channels connected</h3>
            <p className="text-muted-foreground mb-4">Connect your first sales channel to start syncing inventory</p>
            <Button className="w-full sm:w-auto" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Channel
            </Button>
          </div>
        )}
      </div>

      {/* Add Channel Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="w-full max-w-xs sm:max-w-lg md:max-w-xl px-2 sm:px-4 md:px-8 py-6 sm:py-8 rounded-2xl shadow-2xl bg-card border border-border overflow-y-auto max-h-[90vh] mx-auto mt-4 sm:mt-8 mb-2 sm:mb-4">
          <DialogHeader className="mb-4 text-center">
            <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">Add New Sales Channel</DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-muted-foreground">
              Fill in the details below to connect and sync your sales channel.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2 sm:py-4">
            <div className="text-lg font-semibold text-primary mb-2">Channel Details</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Channel Type</label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="focus:ring-2 focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNEL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <FloatingInput
                label="Channel Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., My Shopify Store"
                className="focus:ring-2 focus:ring-primary text-base px-3 py-2"
                labelClassName={`absolute left-3 top-2 pointer-events-none transition-all duration-200 text-sm bg-card px-1
                  ${formData.name || document.activeElement === 'input' ? 'text-primary -translate-y-6 scale-90' : 'text-muted-foreground'}
                `}
              />
            </div>

            <FloatingInput
              label="Store URL"
              value={formData.store_url}
              onChange={(e) => setFormData({ ...formData, store_url: e.target.value })}
              placeholder="https://mystore.shopify.com"
              className="focus:ring-2 focus:ring-primary"
            />

            <div className="text-lg font-semibold text-primary mb-2">API Credentials</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FloatingInput
                label="API Key"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                type="password"
                className="focus:ring-2 focus:ring-primary"
              />
              <FloatingInput
                label="API Secret"
                value={formData.api_secret}
                onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                type="password"
                className="focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="text-lg font-semibold text-primary mb-2">Sync Settings</div>
            <div>
              <label className="text-sm font-medium mb-2 block">Sync Frequency (minutes)</label>
              <Select
                value={formData.sync_frequency.toString()}
                onValueChange={(value) => setFormData({ ...formData, sync_frequency: parseInt(value) })}
              >
                <SelectTrigger className="focus:ring-2 focus:ring-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Every 5 minutes</SelectItem>
                  <SelectItem value="15">Every 15 minutes</SelectItem>
                  <SelectItem value="30">Every 30 minutes</SelectItem>
                  <SelectItem value="60">Every hour</SelectItem>
                  <SelectItem value="180">Every 3 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <RippleButton className="w-full sm:w-auto" onClick={handleAddChannel}>
              Connect Channel
            </RippleButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Channels;
