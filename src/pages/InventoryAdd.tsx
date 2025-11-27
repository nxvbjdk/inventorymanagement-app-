import React from "react";
import { motion } from "framer-motion";
import { Plus, ArrowLeft, Check, Barcode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

const InventoryAdd = () => {
  const navigate = useNavigate();
  const [itemName, setItemName] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);
  const [minQuantity, setMinQuantity] = React.useState(5);
  const [category, setCategory] = React.useState("");
  const [price, setPrice] = React.useState(0);
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");

  const resetForm = () => {
    setItemName("");
    setQuantity(1);
    setMinQuantity(5);
    setCategory("");
    setPrice(0);
    setDescription("");
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemName.trim()) {
      setErrorMessage("Item name is required");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Get the authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setErrorMessage("You must be logged in to add items");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from('inventory').insert([
        {
          name: itemName.trim(),
          quantity,
          min_quantity: minQuantity,
          category,
          price,
          description,
          user_id: user.id
        }
      ]).select();

      if (error) {
        setErrorMessage(error.message || "Failed to add item");
      } else if (data) {
        setSuccessMessage("Item added successfully!");
        resetForm();
        setTimeout(() => {
          navigate('/inventory');
        }, 2000);
      }
    } catch (err) {
      setErrorMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto p-6 space-y-6">
        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 rounded-lg p-4 flex items-center gap-3"
          >
            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-green-800 dark:text-green-200 font-medium">{successMessage}</p>
          </motion.div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 rounded-lg p-4 flex items-center gap-3"
          >
            <p className="text-red-800 dark:text-red-200 font-medium">{errorMessage}</p>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/inventory')}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="space-y-2">
              <h1 className="text-4xl font-display font-bold text-gradient-hero">
                Add New Item
              </h1>
              <p className="text-muted-foreground text-body">
                Create a new inventory item with all details
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/inventory/barcode')}
            className="btn-premium px-6 py-2 h-fit"
            variant="default"
          >
            <Barcode className="h-4 w-4 mr-2" />
            Open Scanner
          </Button>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="card-premium max-w-3xl">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Item Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddItem} className="space-y-6">
                {/* Item Name */}
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                    Item Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter item name"
                    value={itemName}
                    onChange={e => setItemName(e.target.value)}
                    className="w-full"
                    required
                  />
                </div>

                {/* Two Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                      Quantity *
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={quantity}
                      onChange={e => setQuantity(Number(e.target.value))}
                      className="w-full"
                      required
                    />
                  </div>

                  {/* Minimum Quantity */}
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                      Minimum Quantity
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={minQuantity}
                      onChange={e => setMinQuantity(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Two Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                      Category
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., Electronics, Hardware, Software"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                      Price (Optional)
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">$</span>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={price}
                        onChange={e => setPrice(Number(e.target.value))}
                        placeholder="0.00"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                    Description (Optional)
                  </label>
                  <textarea
                    placeholder="Enter detailed description of the item"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-md border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    rows={4}
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-4 justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      navigate('/inventory');
                    }}
                    className="px-8"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="btn-premium px-8"
                    disabled={loading}
                  >
                    {loading ? "Adding Item..." : "Add Item"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl"
        >
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
            <CardContent className="pt-6">
              <div className="text-sm">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Required Fields</h3>
                <p className="text-blue-800 dark:text-blue-300 text-xs">
                  Item Name and Quantity are required to create an item.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700">
            <CardContent className="pt-6">
              <div className="text-sm">
                <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">Low Stock Alert</h3>
                <p className="text-purple-800 dark:text-purple-300 text-xs">
                  Set minimum quantity to receive alerts when stock is low.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
            <CardContent className="pt-6">
              <div className="text-sm">
                <h3 className="font-semibold text-green-900 dark:text-green-200 mb-2">Organize Items</h3>
                <p className="text-green-800 dark:text-green-300 text-xs">
                  Use categories to organize and filter items easily.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default InventoryAdd;
