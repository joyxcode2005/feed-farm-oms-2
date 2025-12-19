/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/src/config";
import toast from "react-hot-toast";
import { X, Plus, Trash2, Loader2, Calendar, Filter, User, CheckCircle2, AlertCircle } from "lucide-react";
import debounce from "lodash/debounce";

interface CreateOrderModalProps {
  onClose: () => void;
  onCreated: () => void;
}

interface AnimalType {
  id: string;
  name: string;
}

interface FeedCategory {
  id: string;
  name: string;
  defaultPrice: number;
  animalType: {
    id: string;
    name: string;
  };
}

interface OrderItemRow {
  feedCategoryId: string;
  quantityBags: number;
  pricePerBag: number;
}

export default function CreateOrderModal({ onClose, onCreated }: CreateOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  
  // Data Store
  const [feedCategories, setFeedCategories] = useState<FeedCategory[]>([]);
  const [animalTypes, setAnimalTypes] = useState<AnimalType[]>([]);
  
  // Customer Form State
  const [phoneSearch, setPhoneSearch] = useState("");
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  // Customer Details Fields
  const [customerName, setCustomerName] = useState("");
  const [customerDistrict, setCustomerDistrict] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerType, setCustomerType] = useState("SINGLE");

  // Order Form State
  const [deliveryDate, setDeliveryDate] = useState("");
  const [selectedAnimalType, setSelectedAnimalType] = useState("");
  const [discountType, setDiscountType] = useState<"FLAT" | "PERCENTAGE">("FLAT");
  const [discountValue, setDiscountValue] = useState(0);
  const [items, setItems] = useState<OrderItemRow[]>([
    { feedCategoryId: "", quantityBags: 1, pricePerBag: 0 }
  ]);

  // Fetch Initial Data (Products only)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [feedRes, animalRes] = await Promise.all([
          api.get("/feed-categories"),
          api.get("/animal-types")
        ]);
        setFeedCategories(feedRes.data.data);
        setAnimalTypes(animalRes.data.data);
      } catch (error) {
        toast.error("Failed to load products");
      }
    };
    fetchData();
  }, []);

  // Debounced Phone Check
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkPhone = useCallback(
    debounce(async (phone: string) => {
      if (phone.length < 3) return;
      
      setCheckingPhone(true);
      try {
        // Updated call: GET /customers/phone?phone=...
        const res = await api.get(`/customers/phone?phone=${phone}`);
        
        if (res.data.data) {
          // Customer Found
          const cust = res.data.data;
          setSelectedCustomerId(cust.id);
          setCustomerName(cust.name);
          setCustomerDistrict(cust.district);
          setCustomerAddress(cust.address || "");
          setCustomerType(cust.type || "SINGLE");
          setIsNewCustomer(false);
          toast.success("Existing customer found!");
        }
      } catch (error: any) {
        // Customer Not Found (404)
        if (error.response?.status === 404) {
          setSelectedCustomerId(null);
          setIsNewCustomer(true);
          // Clear fields for new entry
          setCustomerName("");
          setCustomerDistrict("");
          setCustomerAddress("");
        } else {
          console.error(error);
        }
      } finally {
        setCheckingPhone(false);
      }
    }, 800),
    []
  );

  useEffect(() => {
    if (!phoneSearch) {
      setSelectedCustomerId(null);
      setIsNewCustomer(false);
      setCustomerName("");
      setCustomerDistrict("");
      return;
    }
    checkPhone(phoneSearch);
  }, [phoneSearch, checkPhone]);

  // Filter categories based on selected animal type
  const filteredFeedCategories = selectedAnimalType
    ? feedCategories.filter((f) => f.animalType.id === selectedAnimalType)
    : feedCategories;

  // Handlers
  const handleItemChange = (index: number, field: keyof OrderItemRow, value: any) => {
    const newItems = [...items];
    if (field === "feedCategoryId") {
      const category = feedCategories.find(c => c.id === value);
      newItems[index].pricePerBag = category ? category.defaultPrice : 0;
    }
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { feedCategoryId: "", quantityBags: 1, pricePerBag: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantityBags * item.pricePerBag), 0);
  const discountAmount = discountType === "FLAT" 
    ? discountValue 
    : (subtotal * discountValue) / 100;
  const finalAmount = Math.max(0, subtotal - discountAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryDate) return toast.error("Delivery date is required");
    if (!phoneSearch || phoneSearch.length < 8) return toast.error("Valid phone number required");
    
    // Validate Items
    if (items.some(i => !i.feedCategoryId || i.quantityBags <= 0)) {
      return toast.error("Please fill in valid item details");
    }

    setLoading(true);
    try {
      let finalCustomerId = selectedCustomerId;

      // 1. Create Customer if New
      if (isNewCustomer && !finalCustomerId) {
        if (!customerName || !customerDistrict) {
          setLoading(false);
          return toast.error("Name and District required for new customer");
        }
        
        try {
          const custRes = await api.post("/customers", {
            name: customerName,
            phone: phoneSearch,
            district: customerDistrict,
            address: customerAddress,
            type: customerType
          });
          finalCustomerId = custRes.data.data.id;
        } catch (err: any) {
          setLoading(false);
          return toast.error(err.response?.data?.message || "Failed to create customer");
        }
      }

      // 2. Create Order
      await api.post("/orders", {
        customerId: finalCustomerId,
        deliveryDate,
        discountType,
        discountValue: Number(discountValue),
        items: items.map(i => ({
          feedCategoryId: i.feedCategoryId,
          quantityBags: Number(i.quantityBags),
          pricePerBag: Number(i.pricePerBag)
        }))
      });

      toast.success(isNewCustomer ? "Customer & Order created!" : "Order created successfully");
      onCreated();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-4xl border border-zinc-200 dark:border-zinc-800 my-8">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Create New Order</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          
          {/* Section 1: Customer Details */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-xl border border-zinc-200 dark:border-zinc-700/50 space-y-4">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <User className="w-4 h-4" /> Customer Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Phone Input */}
              <div className="col-span-full md:col-span-1">
                <label className="block text-xs font-medium text-zinc-500 mb-1">Phone Number</label>
                <div className="relative">
                  <input 
                    type="tel"
                    className={`w-full pl-3 pr-10 py-2 rounded-lg border bg-white dark:bg-zinc-800 outline-none transition-colors ${
                      selectedCustomerId 
                        ? "border-green-500 ring-1 ring-green-500/20" 
                        : "border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-indigo-500"
                    }`}
                    placeholder="Enter customer phone..."
                    value={phoneSearch}
                    onChange={(e) => setPhoneSearch(e.target.value)}
                    required
                  />
                  <div className="absolute right-3 top-2.5">
                    {checkingPhone ? (
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                    ) : selectedCustomerId ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                       <User className="w-4 h-4 text-zinc-400" />
                    )}
                  </div>
                </div>
                {selectedCustomerId && !checkingPhone && (
                  <p className="text-xs text-green-600 mt-1.5 font-medium">Existing customer found!</p>
                )}
                {isNewCustomer && !checkingPhone && phoneSearch.length > 3 && (
                  <p className="text-xs text-blue-600 mt-1.5 font-medium">New customer? Fill details below.</p>
                )}
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Customer Name</label>
                <input 
                  type="text"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:bg-zinc-100 dark:disabled:bg-zinc-800/50 disabled:text-zinc-500"
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  disabled={!!selectedCustomerId} 
                  required={isNewCustomer}
                />
              </div>

              {/* Collapsible/Conditional Fields for New Customer */}
              <div className={`col-span-full grid grid-cols-1 md:grid-cols-2 gap-5 transition-all duration-300 ${isNewCustomer || selectedCustomerId ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 hidden'}`}>
                 <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">District</label>
                    <input 
                      type="text"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-500"
                      value={customerDistrict}
                      onChange={(e) => setCustomerDistrict(e.target.value)}
                      disabled={!!selectedCustomerId}
                      required={isNewCustomer}
                      placeholder="District"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Customer Type</label>
                    <select 
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-500"
                      value={customerType}
                      onChange={(e) => setCustomerType(e.target.value)}
                      disabled={!!selectedCustomerId}
                    >
                      <option value="SINGLE">Individual</option>
                      <option value="DISTRIBUTER">Distributor</option>
                    </select>
                 </div>
                 <div className="col-span-full">
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Address (Optional)</label>
                    <input 
                      type="text"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-500"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      disabled={!!selectedCustomerId}
                      placeholder="Full Address"
                    />
                 </div>
              </div>
            </div>
          </div>

          {/* Section 2: Order Details */}
          <div className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Delivery Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                    <input 
                      type="date"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Filter Products by Animal
                  </label>
                  <div className="relative">
                    <Filter className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                    <select 
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      value={selectedAnimalType}
                      onChange={(e) => setSelectedAnimalType(e.target.value)}
                    >
                      <option value="">All Animals</option>
                      {animalTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
             </div>

             {/* Items Table */}
             <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Order Items</label>
                  <button type="button" onClick={addItem} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium bg-indigo-50 px-2 py-1 rounded">
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </div>
                
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-zinc-500">Item</th>
                        <th className="px-4 py-2 text-left font-medium text-zinc-500 w-24">Bags</th>
                        <th className="px-4 py-2 text-left font-medium text-zinc-500 w-32">Price/Bag</th>
                        <th className="px-4 py-2 text-right font-medium text-zinc-500 w-28">Total</th>
                        <th className="px-4 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <select 
                              className="w-full px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-transparent"
                              value={item.feedCategoryId}
                              onChange={(e) => handleItemChange(idx, 'feedCategoryId', e.target.value)}
                              required
                            >
                              <option value="">Select Feed</option>
                              {filteredFeedCategories.map(f => (
                                <option key={f.id} value={f.id}>
                                  {f.name} {!selectedAnimalType && `(${f.animalType.name})`}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input 
                              type="number" 
                              min="1"
                              className="w-full px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-transparent"
                              value={item.quantityBags}
                              onChange={(e) => handleItemChange(idx, 'quantityBags', Number(e.target.value))}
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              type="number" 
                              min="0"
                              className="w-full px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-transparent"
                              value={item.pricePerBag}
                              onChange={(e) => handleItemChange(idx, 'pricePerBag', Number(e.target.value))}
                            />
                          </td>
                          <td className="p-2 text-right font-medium text-zinc-700 dark:text-zinc-300">
                            ₹{(item.quantityBags * item.pricePerBag).toLocaleString()}
                          </td>
                          <td className="p-2 text-center">
                            <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredFeedCategories.length === 0 && selectedAnimalType && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> No feed products found for this animal type.
                  </p>
                )}
             </div>

             {/* Totals */}
             <div className="flex flex-col items-end pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                <div className="w-full md:w-72 space-y-2">
                   <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toLocaleString()}</span>
                   </div>
                   
                   <div className="flex items-center gap-2">
                      <select 
                        className="w-24 text-xs px-2 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as any)}
                      >
                        <option value="FLAT">Flat (₹)</option>
                        <option value="PERCENTAGE">% Off</option>
                      </select>
                      <input 
                        type="number" 
                        min="0"
                        className="flex-1 text-xs px-2 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        placeholder="Discount Value"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                      />
                   </div>

                   <div className="flex justify-between text-lg font-bold text-zinc-900 dark:text-zinc-100 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-700">
                      <span>Total Amount</span>
                      <span>₹{finalAmount.toLocaleString()}</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 rounded-lg flex items-center gap-2 shadow-sm transition-all"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isNewCustomer ? "Save Customer & Order" : "Create Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}