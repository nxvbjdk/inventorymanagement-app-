import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Search, Filter, Edit2, Trash2, Plus, AlertCircle, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { RippleButton } from "@/components/ui/ripple-button";
import { FloatingInput } from "@/components/ui/floating-input";
import { toast } from "@/components/ui/premium-toast";
import { supabase } from "@/lib/supabaseClient";
import InventoryTable, { InventoryItem } from "@/components/InventoryTable";

const Inventory = () => {
  // Inventory state
  const [items, setItems] = React.useState<InventoryItem[]>([]);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<InventoryItem | null>(null);
  const [newItemName, setNewItemName] = React.useState("");
  const [newItemQty, setNewItemQty] = React.useState(1);
  const [newItemMinQty, setNewItemMinQty] = React.useState(5);
  const [newItemCategory, setNewItemCategory] = React.useState("");
  const [newItemPrice, setNewItemPrice] = React.useState(0);
  const [newItemDescription, setNewItemDescription] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [filterCategory, setFilterCategory] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Fetch items from Supabase
  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('inventory').select('*').order('id', { ascending: false });
    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchItems();
  }, []);

  // Show success message
  const showSuccess = (message: string) => {
    toast.success(message, {
      duration: 3000,
      style: {
        background: 'hsl(var(--success) / 0.1)',
        borderColor: 'hsl(var(--success))',
      },
    });
  };

  // Reset form
  const resetForm = () => {
    setNewItemName("");
    setNewItemQty(1);
    setNewItemMinQty(5);
    setNewItemCategory("");
    setNewItemPrice(0);
    setNewItemDescription("");
    setEditingItem(null);
  };

  // Add item handler
  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      alert("You must be logged in to add items");
      return;
    }

    const { data, error } = await supabase.from('inventory').insert([
      {
        name: newItemName.trim(),
        quantity: newItemQty,
        min_quantity: newItemMinQty,
        category: newItemCategory,
        price: newItemPrice,
        description: newItemDescription,
        user_id: user.id
      }
    ]).select();
    if (!error && data) {
      setItems([data[0], ...items]);
      setShowAddModal(false);
      resetForm();
      showSuccess("Item added successfully!");
    }
  };

  // Edit item handler
  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemQty(item.quantity);
    setNewItemMinQty(item.min_quantity || 5);
    setNewItemCategory(item.category || "");
    setNewItemPrice(item.price || 0);
    setNewItemDescription(item.description || "");
    setShowEditModal(true);
  };

  // Update item handler
  const handleUpdateItem = async () => {
    if (!editingItem || !newItemName.trim()) return;
    const { error } = await supabase
      .from('inventory')
      .update({
        name: newItemName.trim(),
        quantity: newItemQty,
        min_quantity: newItemMinQty,
        category: newItemCategory,
        price: newItemPrice,
        description: newItemDescription
      })
      .eq('id', editingItem.id);

    if (!error) {
      setItems(items.map(item => 
        item.id === editingItem.id 
          ? { ...item, name: newItemName, quantity: newItemQty, min_quantity: newItemMinQty, category: newItemCategory, price: newItemPrice, description: newItemDescription }
          : item
      ));
      setShowEditModal(false);
      resetForm();
      showSuccess("Item updated successfully!");
    }
  };

  // Delete item handler
  const handleDeleteItem = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      const { error } = await supabase.from('inventory').delete().eq('id', id);
      if (!error) {
        setItems(items.filter(item => item.id !== id));
        showSuccess("Item deleted successfully!");
      }
    }
  };

  // Update quantity
  const handleUpdateQuantity = async (id: number, newQty: number) => {
    if (newQty < 0) return;
    const { error } = await supabase.from('inventory').update({ quantity: newQty }).eq('id', id);
    if (!error) {
      setItems(items.map(item => item.id === id ? { ...item, quantity: newQty } : item));
    }
  };

  // Get all categories
  const categories = Array.from(new Set(items.map(item => item.category).filter(Boolean))) as string[];

  // Filtered items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !filterCategory || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Low stock items
  const lowStockItems = items.filter(item => item.quantity <= (item.min_quantity || 5));

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-gradient-hero">
              digistock
            </h1>
            <p className="text-muted-foreground text-body mt-1">
              Real-time Management, zero compromise
            </p>
          </div>
          <MagneticButton
            onClick={() => setShowAddModal(true)}
            className="gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </MagneticButton>
        </motion.div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 flex items-start gap-3"
          >
            <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">Low Stock Alert</h3>
              <p className="text-yellow-800 dark:text-yellow-300 text-sm">
                {lowStockItems.length} item(s) are running low on stock: {lowStockItems.map(i => i.name).join(", ")}
              </p>
            </div>
          </motion.div>
        )}

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-wrap"
        >
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items or categories..."
              className="pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {categories.length > 0 && (
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-2 py-2 rounded-md border border-input bg-background text-foreground w-full sm:w-auto"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
        </motion.div>

        {/* Add Item Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-3 sm:p-6 w-full max-w-xs sm:max-w-md border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-display font-bold mb-6 text-gray-900 dark:text-white">Add New Item</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Item Name *</label>
                  <Input
                    placeholder="Enter item name"
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Quantity *</label>
                    <Input
                      type="number"
                      min={0}
                      value={newItemQty}
                      onChange={e => setNewItemQty(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Min. Qty</label>
                    <Input
                      type="number"
                      min={0}
                      value={newItemMinQty}
                      onChange={e => setNewItemMinQty(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Category</label>
                    <Input
                      placeholder="e.g., Electronics"
                      value={newItemCategory}
                      onChange={e => setNewItemCategory(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Price</label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={newItemPrice}
                      onChange={e => setNewItemPrice(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    placeholder="Item description"
                    value={newItemDescription}
                    onChange={e => setNewItemDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => { setShowAddModal(false); resetForm(); }} className="px-6">Cancel</Button>
                <Button onClick={handleAddItem} className="btn-premium px-6">Add Item</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Item Modal */}
        {showEditModal && editingItem && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-3 sm:p-6 w-full max-w-xs sm:max-w-md border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-display font-bold mb-6 text-gray-900 dark:text-white">Edit Item</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Item Name *</label>
                  <Input
                    placeholder="Enter item name"
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Quantity *</label>
                    <Input
                      type="number"
                      min={0}
                      value={newItemQty}
                      onChange={e => setNewItemQty(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Min. Qty</label>
                    <Input
                      type="number"
                      min={0}
                      value={newItemMinQty}
                      onChange={e => setNewItemMinQty(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Category</label>
                    <Input
                      placeholder="e.g., Electronics"
                      value={newItemCategory}
                      onChange={e => setNewItemCategory(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Price</label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={newItemPrice}
                      onChange={e => setNewItemPrice(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    placeholder="Item description"
                    value={newItemDescription}
                    onChange={e => setNewItemDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => { setShowEditModal(false); resetForm(); }} className="px-6">Cancel</Button>
                <Button onClick={handleUpdateItem} className="btn-premium px-6">Update Item</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Inventory Items Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <InventoryTable
            items={filteredItems}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteItem}
            itemsPerPage={10}
          />
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4"
        >
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 sm:p-6">
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-2xl sm:text-3xl font-bold">{items.length}</div>
              <p className="text-sm opacity-90 mt-2">Total Items</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white p-3 sm:p-6">
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-2xl sm:text-3xl font-bold">{items.reduce((sum, item) => sum + item.quantity, 0)}</div>
              <p className="text-sm opacity-90 mt-2">Total Stock</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white p-3 sm:p-6">
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-2xl sm:text-3xl font-bold">{lowStockItems.length}</div>
              <p className="text-sm opacity-90 mt-2">Low Stock Items</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Inventory;
