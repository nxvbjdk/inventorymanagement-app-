import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Edit2, Trash2, AlertCircle, CheckCircle, Eye, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RippleButton } from '@/components/ui/ripple-button';

export interface InventoryItem {
  id: number;
  name: string;
  category?: string;
  quantity: number;
  min_quantity?: number;
  sku?: string;
  price?: number;
  description?: string;
}

export interface InventoryTableProps {
  items: InventoryItem[];
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (itemId: number) => void;
  itemsPerPage?: number;
}

type SortField = 'name' | 'category' | 'quantity' | 'sku';
type SortDirection = 'asc' | 'desc';

const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  onEdit,
  onDelete,
  itemsPerPage = 10,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const toggleRowExpanded = (itemId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedRows(newExpanded);
  };

  // Sort items
  const sortedItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle undefined values
      if (aValue === undefined) aValue = '';
      if (bValue === undefined) bValue = '';

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [items, sortField, sortDirection]);

  // Paginate items
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedItems.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedItems, currentPage, itemsPerPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const getStockStatus = (quantity: number, minQuantity?: number) => {
    const threshold = minQuantity || 5;
    if (quantity === 0) return { status: 'out', label: 'Out of Stock', color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' };
    if (quantity <= threshold) return { status: 'low', label: 'Low Stock', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' };
    return { status: 'healthy', label: 'In Stock', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' };
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <div className="w-4 h-4" />;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  return (
    <div className="space-y-4">
      <Card className="card-premium overflow-hidden">
        <CardHeader>
          <CardTitle className="font-display">Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Table Wrapper */}
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Header */}
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-4 w-12"></th>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    >
                      Item Name
                      <SortIcon field="name" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('category')}
                      className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    >
                      Category
                      <SortIcon field="category" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('quantity')}
                      className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    >
                      Stock
                      <SortIcon field="quantity" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('sku')}
                      className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    >
                      SKU
                      <SortIcon field="sku" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right font-semibold text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* Body */}
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <AlertCircle className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                        <p className="text-gray-600 dark:text-gray-400 font-medium">No items found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item, index) => {
                    const status = getStockStatus(item.quantity, item.min_quantity);
                    const isExpanded = expandedRows.has(item.id);
                    const isHovered = hoveredRow === item.id;
                    
                    return (
                      <React.Fragment key={item.id}>
                        <motion.tr
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-all duration-200 cursor-pointer group"
                          onMouseEnter={() => setHoveredRow(item.id)}
                          onMouseLeave={() => setHoveredRow(null)}
                        >
                          {/* Expand Icon */}
                          <td className="px-4 py-4 w-12">
                            <motion.button
                              onClick={() => toggleRowExpanded(item.id)}
                              className="p-1 hover:bg-accent rounded-md transition-colors"
                              animate={{ rotate: isExpanded ? 90 : 0 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </motion.button>
                          </td>

                          {/* Item Name */}
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <p className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">{item.name}</p>
                              {item.description && !isExpanded && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-6 py-4">
                            {item.category ? (
                              <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                                {item.category}
                              </span>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400 text-sm">—</span>
                            )}
                          </td>

                          {/* Stock Quantity */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <motion.span 
                                className="font-semibold text-lg text-gray-900 dark:text-white"
                                animate={{ scale: isHovered ? 1.1 : 1 }}
                                transition={{ type: "spring", stiffness: 300 }}
                              >
                                {item.quantity}
                              </motion.span>
                              {item.min_quantity && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  (min: {item.min_quantity})
                                </span>
                              )}
                            </div>
                          </td>

                          {/* SKU */}
                          <td className="px-6 py-4">
                            {item.sku ? (
                              <code className="text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-1 rounded font-mono">
                                {item.sku}
                              </code>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400 text-sm">—</span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {status.status === 'out' && (
                                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                              )}
                              {status.status === 'low' && (
                                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                              )}
                              {status.status === 'healthy' && (
                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                              )}
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                                {status.label}
                              </span>
                            </div>
                          </td>

                          {/* Actions - Show on hover */}
                          <td className="px-6 py-4 text-right">
                            <AnimatePresence>
                              {isHovered && (
                                <motion.div
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 20 }}
                                  transition={{ duration: 0.2 }}
                                  className="flex gap-2 justify-end"
                                >
                                  <RippleButton
                                    size="sm"
                                    variant="outline"
                                    onClick={() => toggleRowExpanded(item.id)}
                                    className="h-8 w-8 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                                  >
                                    <Eye className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                  </RippleButton>
                                  {onEdit && (
                                    <RippleButton
                                      size="sm"
                                      variant="outline"
                                      onClick={() => onEdit(item)}
                                      className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                    >
                                      <Edit2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </RippleButton>
                                  )}
                                  {onDelete && (
                                    <RippleButton
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        if (confirm(`Delete "${item.name}"?`)) {
                                          onDelete(item.id);
                                        }
                                      }}
                                      className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    </RippleButton>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </td>
                        </motion.tr>

                        {/* Expanded Row Details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.tr
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <td colSpan={7} className="px-6 py-4 bg-accent/50">
                                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-card">
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Description</p>
                                    <p className="text-sm text-foreground">{item.description || "No description provided"}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Price</p>
                                    <p className="text-sm text-foreground font-semibold">{item.price ? `$${item.price.toFixed(2)}` : "—"}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Total Value</p>
                                    <p className="text-sm text-foreground font-semibold">
                                      {item.price ? `$${(item.price * item.quantity).toFixed(2)}` : "—"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Item ID</p>
                                    <p className="text-sm text-foreground font-mono">#{item.id}</p>
                                  </div>
                                </div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-semibold">
                  {Math.min(currentPage * itemsPerPage, sortedItems.length)}
                </span>{' '}
                of <span className="font-semibold">{sortedItems.length}</span> items
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2 px-3">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryTable;
