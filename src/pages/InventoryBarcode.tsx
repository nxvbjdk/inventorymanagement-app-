import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Barcode, ArrowLeft, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import BarcodeScanner from '@/components/BarcodeScanner';

interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  barcode?: string;
  min_quantity?: number;
  category?: string;
  price?: number;
  description?: string;
}

const InventoryBarcode = () => {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [foundItem, setFoundItem] = useState<InventoryItem | null>(null);
  const [updatingStock, setUpdatingStock] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  React.useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('name', { ascending: true });
    if (!error && data) {
      setItems(data);
    }
  };

  const handleBarcodeScan = async (barcode: string) => {
    setScannedBarcode(barcode);
    setSearchQuery(barcode);

    // Search for item by barcode or name
    const foundByBarcode = items.find(
      item => item.barcode === barcode
    );

    if (foundByBarcode) {
      setFoundItem(foundByBarcode);
      setSuccessMessage(`Found: ${foundByBarcode.name}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage(`Barcode "${barcode}" not found in inventory`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleUpdateStock = async (itemId: number, newQuantity: number) => {
    setUpdatingStock(true);
    const { error } = await supabase
      .from('inventory')
      .update({ quantity: newQuantity })
      .eq('id', itemId);

    if (!error) {
      setItems(items.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
      setFoundItem(null);
      setScannedBarcode('');
      setSearchQuery('');
      setSuccessMessage('Stock updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage('Failed to update stock');
    }
    setUpdatingStock(false);
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.barcode?.includes(searchQuery)
  );

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
            <p className="text-green-800 dark:text-green-200 font-medium">{successMessage}</p>
          </motion.div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 rounded-lg p-4"
          >
            <p className="text-red-800 dark:text-red-200 font-medium">{errorMessage}</p>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/inventory')}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-2">
            <h1 className="text-4xl font-display font-bold text-gradient-hero flex items-center gap-2">
              <Barcode className="h-10 w-10" />
              Barcode Scanner
            </h1>
            <p className="text-muted-foreground text-body">
              Scan barcodes to find items and update stock quantities
            </p>
          </div>
        </motion.div>

        {/* Scanner Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            onClick={() => setShowScanner(true)}
            className="btn-premium px-8 py-6 text-lg w-full md:w-auto"
          >
            <Barcode className="h-5 w-5 mr-2" />
            Open Scanner
          </Button>
        </motion.div>

        {/* Scanner Modal */}
        {showScanner && (
          <BarcodeScanner
            onBarcodeScan={handleBarcodeScan}
            onClose={() => setShowScanner(false)}
          />
        )}

        {/* Found Item Display */}
        {foundItem && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card className="card-premium bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="font-display">Item Found</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Item Name</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{foundItem.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Current Stock</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{foundItem.quantity}</p>
                  </div>
                  {foundItem.category && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Category</p>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">{foundItem.category}</p>
                    </div>
                  )}
                  {foundItem.price && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Price</p>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">${foundItem.price.toFixed(2)}</p>
                    </div>
                  )}
                </div>

                {foundItem.description && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Description</p>
                    <p className="text-gray-700 dark:text-gray-300">{foundItem.description}</p>
                  </div>
                )}

                {/* Stock Update Controls */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3 border border-gray-200 dark:border-gray-700 mt-6">
                  <p className="font-semibold text-gray-900 dark:text-white">Update Stock</p>
                  <div className="flex gap-2 flex-wrap">
                    {[-5, -1, 1, 5].map(change => (
                      <Button
                        key={change}
                        onClick={() => handleUpdateStock(foundItem.id, Math.max(0, foundItem.quantity + change))}
                        disabled={updatingStock}
                        className={`flex-1 ${
                          change < 0
                            ? 'bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400'
                            : 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400'
                        }`}
                      >
                        {change > 0 ? '+' : ''}{change}
                      </Button>
                    ))}
                  </div>
                  <Button
                    onClick={() => {
                      setFoundItem(null);
                      setScannedBarcode('');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="font-display">Search Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, category, or barcode..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Items List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="font-display">Inventory Items ({filteredItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No items found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredItems.map(item => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setFoundItem(item)}
                      className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-blue-100 dark:border-gray-600 cursor-pointer"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-lg text-gray-900 dark:text-white">{item.name}</div>
                        <div className="flex gap-2 flex-wrap mt-2">
                          {item.category && (
                            <span className="inline-block bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-xs font-medium">
                              {item.category}
                            </span>
                          )}
                          <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-medium">
                            Stock: {item.quantity}
                          </span>
                        </div>
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

export default InventoryBarcode;
