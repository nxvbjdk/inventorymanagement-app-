'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Plus, Edit2, Trash2, Calendar, DollarSign, Truck, Clock, CheckCircle, AlertCircle, X, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';

interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  supplier_name?: string;
  items: OrderItem[];
  order_date: string;
  expected_date: string;
  received_date?: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  notes?: string;
  created_at: string;
}

interface OrderItem {
  id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Supplier {
  id: string;
  name: string;
}

const PurchaseOrders = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    supplier_id: '',
    order_number: '',
    expected_date: '',
    status: 'pending' as const,
    notes: '',
    items: [] as OrderItem[],
  });

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('order_date', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('status', 'active');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const handleAddOrder = async () => {
    if (!formData.supplier_id || !formData.order_number || formData.items.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Get the authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert('You must be logged in to create orders');
        return;
      }

      const totalAmount = formData.items.reduce((sum, item) => sum + item.total, 0);
      const { error } = await supabase.from('purchase_orders').insert([
        {
          order_number: formData.order_number,
          supplier_id: formData.supplier_id,
          supplier_name: suppliers.find(s => s.id === formData.supplier_id)?.name || '',
          items: formData.items,
          order_date: new Date().toISOString().split('T')[0],
          expected_date: formData.expected_date,
          status: formData.status,
          total_amount: totalAmount,
          notes: formData.notes,
          user_id: user.id,
        },
      ]);

      if (error) throw error;
      setSuccessMessage('Purchase order created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchOrders();
    } catch (error) {
      alert('Error creating order: ' + (error as any).message);
    }
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;

    try {
      const totalAmount = formData.items.reduce((sum, item) => sum + item.total, 0);
      const { error } = await supabase
        .from('purchase_orders')
        .update({
          order_number: formData.order_number,
          supplier_id: formData.supplier_id,
          items: formData.items,
          expected_date: formData.expected_date,
          status: formData.status,
          total_amount: totalAmount,
          notes: formData.notes,
        })
        .eq('id', editingOrder.id);

      if (error) throw error;
      setSuccessMessage('Purchase order updated successfully!');
      setShowEditModal(false);
      resetForm();
      fetchOrders();
    } catch (error) {
      alert('Error updating order: ' + (error as any).message);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this purchase order?')) return;

    try {
      const { error } = await supabase.from('purchase_orders').delete().eq('id', id);

      if (error) throw error;
      setSuccessMessage('Purchase order deleted successfully!');
      fetchOrders();
    } catch (error) {
      alert('Error deleting order: ' + (error as any).message);
    }
  };

  const handleOpenEdit = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setFormData({
      supplier_id: order.supplier_id,
      order_number: order.order_number,
      expected_date: order.expected_date,
      status: order.status,
      notes: order.notes || '',
      items: order.items,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      supplier_id: '',
      order_number: '',
      expected_date: '',
      status: 'pending',
      notes: '',
      items: [],
    });
    setEditingOrder(null);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          id: Date.now().toString(),
          item_id: '',
          item_name: '',
          quantity: 1,
          unit_price: 0,
          total: 0,
        },
      ],
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.items];
    (updatedItems[index] as any)[field] = value;

    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unit_price;
    }

    setFormData({ ...formData, items: updatedItems });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (order.notes?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus = !filterStatus || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      case 'shipped':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200';
      case 'delivered':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto p-6 space-y-6">
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg border border-green-300 dark:border-green-700"
          >
            {successMessage}
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-display font-bold text-gradient-hero">
              Purchase Orders
            </h1>
            <p className="text-muted-foreground text-body">
              Track and manage all purchase orders
            </p>
          </div>
          <Button onClick={() => { setShowCreateModal(true); resetForm(); }} className="btn-premium">
            <Plus className="h-4 w-4 mr-2" />
            Create Order
          </Button>
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number or notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-md border border-input bg-background text-foreground w-full md:w-40"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </motion.div>

        {/* Create Order Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Create Purchase Order</h2>
                <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="text-gray-500 hover:text-gray-700">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Supplier *</label>
                    <select
                      value={formData.supplier_id}
                      onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Order Number *</label>
                    <Input
                      placeholder="e.g., PO-2024-001"
                      value={formData.order_number}
                      onChange={e => setFormData({ ...formData, order_number: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Expected Delivery *</label>
                    <Input
                      type="date"
                      value={formData.expected_date}
                      onChange={e => setFormData({ ...formData, expected_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Notes</label>
                  <textarea
                    placeholder="Add any notes or special instructions..."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground resize-none"
                    rows={3}
                  />
                </div>

                {/* Items Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Order Items *</h3>
                    <Button size="sm" variant="outline" onClick={addItem} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Item
                    </Button>
                  </div>

                  {formData.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No items added yet. Click "Add Item" to get started.</p>
                  ) : (
                    <div className="space-y-3">
                      {formData.items.map((item, index) => (
                        <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Item {index + 1}</span>
                            <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700">
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Item Name</label>
                              <Input
                                placeholder="Item name"
                                value={item.item_name}
                                onChange={e => updateItem(index, 'item_name', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Quantity</label>
                              <Input
                                type="number"
                                placeholder="Qty"
                                value={item.quantity}
                                onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Unit Price</label>
                              <Input
                                type="number"
                                placeholder="Price"
                                step="0.01"
                                value={item.unit_price}
                                onChange={e => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Total</label>
                              <div className="px-3 py-2 rounded-md border border-input bg-gray-50 dark:bg-gray-700/50 text-foreground">
                                ${item.total.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-end">
                    <div className="text-lg font-semibold">
                      Total: ${formData.items.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => { setShowCreateModal(false); resetForm(); }} className="px-6">Cancel</Button>
                <Button onClick={handleAddOrder} className="btn-premium px-6">Create Order</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Order Modal */}
        {showEditModal && editingOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Edit Purchase Order</h2>
                <button onClick={() => { setShowEditModal(false); resetForm(); }} className="text-gray-500 hover:text-gray-700">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Supplier *</label>
                    <select
                      value={formData.supplier_id}
                      onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Order Number *</label>
                    <Input
                      placeholder="e.g., PO-2024-001"
                      value={formData.order_number}
                      onChange={e => setFormData({ ...formData, order_number: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Expected Delivery *</label>
                    <Input
                      type="date"
                      value={formData.expected_date}
                      onChange={e => setFormData({ ...formData, expected_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Notes</label>
                  <textarea
                    placeholder="Add any notes or special instructions..."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground resize-none"
                    rows={3}
                  />
                </div>

                {/* Items Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Order Items *</h3>
                    <Button size="sm" variant="outline" onClick={addItem} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Item
                    </Button>
                  </div>

                  {formData.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No items added yet. Click "Add Item" to get started.</p>
                  ) : (
                    <div className="space-y-3">
                      {formData.items.map((item, index) => (
                        <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Item {index + 1}</span>
                            <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700">
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Item Name</label>
                              <Input
                                placeholder="Item name"
                                value={item.item_name}
                                onChange={e => updateItem(index, 'item_name', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Quantity</label>
                              <Input
                                type="number"
                                placeholder="Qty"
                                value={item.quantity}
                                onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Unit Price</label>
                              <Input
                                type="number"
                                placeholder="Price"
                                step="0.01"
                                value={item.unit_price}
                                onChange={e => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Total</label>
                              <div className="px-3 py-2 rounded-md border border-input bg-gray-50 dark:bg-gray-700/50 text-foreground">
                                ${item.total.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-end">
                    <div className="text-lg font-semibold">
                      Total: ${formData.items.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => { setShowEditModal(false); resetForm(); }} className="px-6">Cancel</Button>
                <Button onClick={handleUpdateOrder} className="btn-premium px-6">Update Order</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Orders List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {filteredOrders.length === 0 ? (
            <Card className="card-premium">
              <CardContent className="pt-12 pb-12 text-center">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground text-lg">
                  {search || filterStatus ? "No purchase orders found. Try adjusting your search." : "No purchase orders yet. Create your first order to get started."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="card-premium hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="font-display text-xl mb-2">
                          Order {order.order_number}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {suppliers.find(s => s.id === order.supplier_id)?.name || 'Unknown Supplier'}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Order Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Order Date</p>
                        <p className="flex items-center gap-2 text-sm font-medium mt-1">
                          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          {new Date(order.order_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Expected Delivery</p>
                        <p className="flex items-center gap-2 text-sm font-medium mt-1">
                          <Truck className="h-4 w-4 text-green-600 dark:text-green-400" />
                          {new Date(order.expected_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Total Amount</p>
                        <p className="flex items-center gap-2 text-sm font-medium mt-1">
                          <DollarSign className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          ${order.total_amount.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Items Count</p>
                        <p className="text-sm font-medium mt-1">{order.items.length} items</p>
                      </div>
                    </div>

                    {/* Items List */}
                    {order.items.length > 0 && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <p className="text-sm font-semibold mb-2">Items:</p>
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-gray-700 dark:text-gray-300">
                                {item.item_name} x {item.quantity}
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                ${item.total.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {order.notes && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Notes:</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{order.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(order)}
                        className="flex-1 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteOrder(order.id)}
                        className="flex-1 hover:bg-red-100 dark:hover:bg-red-900/30"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{orders.length}</div>
              <p className="text-sm opacity-90 mt-2">Total Orders</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{orders.filter(o => o.status === 'pending').length}</div>
              <p className="text-sm opacity-90 mt-2">Pending</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{orders.filter(o => o.status === 'shipped').length}</div>
              <p className="text-sm opacity-90 mt-2">Shipped</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">${orders.reduce((sum, o) => sum + o.total_amount, 0).toFixed(0)}</div>
              <p className="text-sm opacity-90 mt-2">Total Value</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PurchaseOrders;
