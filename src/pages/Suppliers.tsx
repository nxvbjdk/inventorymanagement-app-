import React from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter, Edit2, Trash2, Mail, Phone, MapPin, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  status?: string;
  rating?: number;
  products?: string[];
  payment_terms?: string;
  created_at?: string;
}

const Suppliers = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [editingSupplier, setEditingSupplier] = React.useState<Supplier | null>(null);
  const [search, setSearch] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState("");

  // Form states
  const [formData, setFormData] = React.useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    status: "active",
    rating: 5,
    products: "",
    payment_terms: "",
  });

  // Fetch suppliers from Supabase
  const fetchSuppliers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });
    if (!error && data) {
      setSuppliers(data);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchSuppliers();
  }, []);

  // Show success message
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      country: "",
      status: "active",
      rating: 5,
      products: "",
      payment_terms: "",
    });
    setEditingSupplier(null);
  };

  // Add supplier handler
  const handleAddSupplier = async () => {
    if (!formData.name.trim()) {
      alert("Supplier name is required");
      return;
    }

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      alert("Error: You must be logged in to add suppliers");
      return;
    }

    const { data, error } = await supabase
      .from('suppliers')
      .insert([
        {
          name: formData.name.trim(),
          contact_person: formData.contact_person,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          status: formData.status,
          rating: formData.rating,
          products: formData.products ? formData.products.split(',').map(p => p.trim()) : [],
          payment_terms: formData.payment_terms,
          user_id: user.id,
        }
      ])
      .select();

    if (!error && data) {
      setSuppliers([...suppliers, data[0]]);
      setShowAddModal(false);
      resetForm();
      showSuccess("Supplier added successfully!");
    } else {
      alert("Error adding supplier: " + error?.message);
    }
  };

  // Edit supplier handler
  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      city: supplier.city || "",
      country: supplier.country || "",
      status: supplier.status || "active",
      rating: supplier.rating || 5,
      products: Array.isArray(supplier.products) ? supplier.products.join(", ") : "",
      payment_terms: supplier.payment_terms || "",
    });
    setShowEditModal(true);
  };

  // Update supplier handler
  const handleUpdateSupplier = async () => {
    if (!editingSupplier || !formData.name.trim()) {
      alert("Supplier name is required");
      return;
    }

    const { error } = await supabase
      .from('suppliers')
      .update({
        name: formData.name.trim(),
        contact_person: formData.contact_person,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        status: formData.status,
        rating: formData.rating,
        products: formData.products ? formData.products.split(',').map(p => p.trim()) : [],
        payment_terms: formData.payment_terms,
      })
      .eq('id', editingSupplier.id);

    if (!error) {
      setSuppliers(suppliers.map(s =>
        s.id === editingSupplier.id
          ? {
              ...s,
              ...formData,
              products: formData.products ? formData.products.split(',').map(p => p.trim()) : [],
            }
          : s
      ));
      setShowEditModal(false);
      resetForm();
      showSuccess("Supplier updated successfully!");
    } else {
      alert("Error updating supplier: " + error?.message);
    }
  };

  // Delete supplier handler
  const handleDeleteSupplier = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (!error) {
        setSuppliers(suppliers.filter(s => s.id !== id));
        showSuccess("Supplier deleted successfully!");
      } else {
        alert("Error deleting supplier: " + error?.message);
      }
    }
  };

  // Filtered suppliers
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(search.toLowerCase()) ||
      supplier.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(search.toLowerCase()) ||
      supplier.phone?.includes(search);
    const matchesStatus = !filterStatus || supplier.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statuses = Array.from(new Set(suppliers.map(s => s.status).filter(Boolean))) as string[];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto p-6 space-y-6">
        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 rounded-lg p-4 flex items-center gap-3"
          >
            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-green-800 dark:text-green-200 font-medium">{successMessage}</p>
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
              Suppliers Management
            </h1>
            <p className="text-muted-foreground text-body">
              Manage your suppliers, track ratings, and monitor payment terms
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="btn-premium px-6 py-2 h-fit"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-4 flex-wrap"
        >
          <div className="flex-1 min-w-[250px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search suppliers by name, contact, email..."
              className="pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {statuses.length > 0 && (
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-md border border-input bg-background text-foreground"
            >
              <option value="">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          )}
        </motion.div>

        {/* Add Supplier Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-display font-bold mb-6 text-gray-900 dark:text-white">Add New Supplier</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Supplier Name *</label>
                  <Input
                    placeholder="Enter supplier name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Contact Person</label>
                  <Input
                    placeholder="Contact person name"
                    value={formData.contact_person}
                    onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Email</label>
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Phone</label>
                    <Input
                      placeholder="Phone number"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Address</label>
                  <Input
                    placeholder="Street address"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">City</label>
                    <Input
                      placeholder="City"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Country</label>
                    <Input
                      placeholder="Country"
                      value={formData.country}
                      onChange={e => setFormData({ ...formData, country: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Rating (1-5)</label>
                    <select
                      value={formData.rating}
                      onChange={e => setFormData({ ...formData, rating: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
                    >
                      {[1, 2, 3, 4, 5].map(r => (
                        <option key={r} value={r}>{r} Stars</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Products (comma-separated)</label>
                  <Input
                    placeholder="e.g., Electronics, Cables, Adapters"
                    value={formData.products}
                    onChange={e => setFormData({ ...formData, products: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Payment Terms</label>
                  <Input
                    placeholder="e.g., Net 30, Net 60, COD"
                    value={formData.payment_terms}
                    onChange={e => setFormData({ ...formData, payment_terms: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => { setShowAddModal(false); resetForm(); }} className="px-6">Cancel</Button>
                <Button onClick={handleAddSupplier} className="btn-premium px-6">Add Supplier</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Supplier Modal */}
        {showEditModal && editingSupplier && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-display font-bold mb-6 text-gray-900 dark:text-white">Edit Supplier</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Supplier Name *</label>
                  <Input
                    placeholder="Enter supplier name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Contact Person</label>
                  <Input
                    placeholder="Contact person name"
                    value={formData.contact_person}
                    onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Email</label>
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Phone</label>
                    <Input
                      placeholder="Phone number"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Address</label>
                  <Input
                    placeholder="Street address"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">City</label>
                    <Input
                      placeholder="City"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Country</label>
                    <Input
                      placeholder="Country"
                      value={formData.country}
                      onChange={e => setFormData({ ...formData, country: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Rating (1-5)</label>
                    <select
                      value={formData.rating}
                      onChange={e => setFormData({ ...formData, rating: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
                    >
                      {[1, 2, 3, 4, 5].map(r => (
                        <option key={r} value={r}>{r} Stars</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Products (comma-separated)</label>
                  <Input
                    placeholder="e.g., Electronics, Cables, Adapters"
                    value={formData.products}
                    onChange={e => setFormData({ ...formData, products: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Payment Terms</label>
                  <Input
                    placeholder="e.g., Net 30, Net 60, COD"
                    value={formData.payment_terms}
                    onChange={e => setFormData({ ...formData, payment_terms: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => { setShowEditModal(false); resetForm(); }} className="px-6">Cancel</Button>
                <Button onClick={handleUpdateSupplier} className="btn-premium px-6">Update Supplier</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Suppliers Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {filteredSuppliers.length === 0 ? (
            <Card className="card-premium">
              <CardContent className="pt-12 pb-12 text-center">
                <p className="text-muted-foreground text-lg">No suppliers found. {search || filterStatus ? "Try adjusting your search." : "Add your first supplier to get started."}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuppliers.map((supplier, index) => (
                <motion.div
                  key={supplier.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="card-premium h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="font-display text-xl">{supplier.name}</CardTitle>
                          {supplier.contact_person && (
                            <p className="text-sm text-muted-foreground mt-1">{supplier.contact_person}</p>
                          )}
                        </div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          supplier.status === 'active'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                            : supplier.status === 'pending'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}>
                          {supplier.status || 'Active'}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Contact Info */}
                      <div className="space-y-2">
                        {supplier.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <a href={`mailto:${supplier.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                              {supplier.email}
                            </a>
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <a href={`tel:${supplier.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                              {supplier.phone}
                            </a>
                          </div>
                        )}
                        {supplier.address && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {supplier.address}{supplier.city ? `, ${supplier.city}` : ''}{supplier.country ? `, ${supplier.country}` : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Products */}
                      {supplier.products && supplier.products.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Products:</p>
                          <div className="flex flex-wrap gap-2">
                            {(Array.isArray(supplier.products) ? supplier.products : []).map((product, idx) => (
                              <span key={idx} className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                                {product}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rating & Payment Terms */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Rating</p>
                          <p className="text-lg font-semibold text-yellow-500">★ {supplier.rating || 0}/5</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Payment Terms</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{supplier.payment_terms || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(supplier)}
                          className="flex-1 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteSupplier(supplier.id)}
                          className="flex-1 hover:bg-red-100 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{suppliers.length}</div>
              <p className="text-sm opacity-90 mt-2">Total Suppliers</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{suppliers.filter(s => s.status === 'active').length}</div>
              <p className="text-sm opacity-90 mt-2">Active Suppliers</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">
                {suppliers.length > 0 ? (suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / suppliers.length).toFixed(1) : 0}
              </div>
              <p className="text-sm opacity-90 mt-2">Average Rating</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Suppliers;
