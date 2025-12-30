/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/src/config";
import toast from "react-hot-toast";
import {
  X,
  Plus,
  Trash2,
  Loader2,
  Calendar,
  Filter,
  User,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import debounce from "lodash/debounce";
import { WEST_BENGAL_DISTRICTS } from "../constants/districts";

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


const NEXT_PUBLIC_GEOAPIFY_API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || "";

export default function CreateOrderModal({
  onClose,
  onCreated,
}: CreateOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  // Data Store
  const [feedCategories, setFeedCategories] = useState<FeedCategory[]>([]);
  const [animalTypes, setAnimalTypes] = useState<AnimalType[]>([]);

  // Customer Form State
  const [phoneSearch, setPhoneSearch] = useState("");
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );

  // Customer Details Fields
  const [customerName, setCustomerName] = useState("");
  const [customerDistrict, setCustomerDistrict] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerType, setCustomerType] = useState("SINGLE");
  // New Location Fields
  const [customerLatitude, setCustomerLatitude] = useState("");
  const [customerLongitude, setCustomerLongitude] = useState("");

  // Order Form State
  const [deliveryDate, setDeliveryDate] = useState("");
  const [selectedAnimalType, setSelectedAnimalType] = useState("");
  const [discountType, setDiscountType] = useState<
    "NONE" | "FLAT" | "PERCENTAGE"
  >("NONE");
  const [discountValue, setDiscountValue] = useState(0);
  const [items, setItems] = useState<OrderItemRow[]>([
    { feedCategoryId: "", quantityBags: 1, pricePerBag: 0 },
  ]);

  // Fetch Initial Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [feedRes, animalRes] = await Promise.all([
          api.get("/feed-categories"),
          api.get("/animal-types"),
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
        const res = await api.get(`/customers/phone?phone=${phone}`);

        if (res.data.data) {
          const cust = res.data.data;
          setSelectedCustomerId(cust.id);
          setCustomerName(cust.name);
          setCustomerDistrict(cust.district);
          setCustomerAddress(cust.address || "");
          setCustomerType(cust.type || "SINGLE");
<<<<<<< HEAD
          // Existing customer coordinates might not be returned by this specific API,
          // but we reset them to empty to avoid confusion
=======
>>>>>>> edce87e5e6ba653643f3f4f3a114bbd41500da29
          setCustomerLatitude("");
          setCustomerLongitude("");
          setIsNewCustomer(false);
          toast.success("Existing customer found!");
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          setSelectedCustomerId(null);
          setIsNewCustomer(true);
          setCustomerName("");
          setCustomerDistrict("");
          setCustomerAddress("");
          setCustomerLatitude("");
          setCustomerLongitude("");
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
      setCustomerLatitude("");
      setCustomerLongitude("");
      return;
    }
    checkPhone(phoneSearch);
  }, [phoneSearch, checkPhone]);

  const filteredFeedCategories = selectedAnimalType
    ? feedCategories.filter((f) => f.animalType.id === selectedAnimalType)
    : feedCategories;

  const handleAutoLocation = async () => {
    if (!customerDistrict) return toast.error("Please select a district first");

    setGeoLoading(true);
    try {
      // 1. Combine your search string
      const query = `${
        customerAddress || ""
      }, ${customerDistrict}, West Bengal, India`;

      // 2. Use Geoapify (or LocationIQ) instead of Nominatim
      // Replace YOUR_API_KEY with the free key you get from their dashboard
      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
          query
        )}&apiKey=${NEXT_PUBLIC_GEOAPIFY_API_KEY}`
      );
      const data = await res.json();

      if (data.features && data.features.length > 0) {
        const [lon, lat] = data.features[0].geometry.coordinates;

        setCustomerLatitude(lat.toString());
        setCustomerLongitude(lon.toString());

        toast.success(
          `Found landmark: ${data.features[0].properties.name || "Location"}`
        );
      } else {
        toast.error(
          "Landmark not found. Try adding a nearby station or park name."
        );
      }
    } catch (error) {
      toast.error("Failed to fetch location data");
    } finally {
      setGeoLoading(false);
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof OrderItemRow,
    value: any
  ) => {
    const newItems = [...items];
    if (field === "feedCategoryId") {
      const category = feedCategories.find((c) => c.id === value);
      newItems[index].pricePerBag = category ? category.defaultPrice : 0;
    }
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      { feedCategoryId: "", quantityBags: 1, pricePerBag: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantityBags * item.pricePerBag,
    0
  );

  const discountAmount =
    discountType === "NONE"
      ? 0
      : discountType === "FLAT"
      ? discountValue
      : (subtotal * discountValue) / 100;

  const finalAmount = Math.max(0, subtotal - discountAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryDate) return toast.error("Delivery date is required");
    if (!phoneSearch || phoneSearch.length < 8)
      return toast.error("Valid phone number required");

    if (items.some((i) => !i.feedCategoryId || i.quantityBags <= 0)) {
      return toast.error("Please fill in valid item details");
    }

    setLoading(true);
    try {
      let finalCustomerId = selectedCustomerId;

      if (isNewCustomer && !finalCustomerId) {
        if (!customerName || !customerDistrict) {
          setLoading(false);
          return toast.error("Name and District required for new customer");
        }

        const custRes = await api.post("/customers", {
          name: customerName,
          phone: phoneSearch,
          district: customerDistrict,
          address: customerAddress,
          type: customerType,
          latitude: customerLatitude ? parseFloat(customerLatitude) : null,
          longitude: customerLongitude ? parseFloat(customerLongitude) : null,
        });
        finalCustomerId = custRes.data.data.id;
      }

      const payload: any = {
        customerId: finalCustomerId,
        deliveryDate,
        items: items.map((i) => ({
          feedCategoryId: i.feedCategoryId,
          quantityBags: Number(i.quantityBags),
          pricePerBag: Number(i.pricePerBag),
        })),
      };

      if (discountType !== "NONE" && discountValue > 0) {
        payload.discountType = discountType;
        payload.discountValue = Number(discountValue);
      }

      await api.post("/orders", payload);

      toast.success(
        isNewCustomer
          ? "Customer & Order created!"
          : "Order created successfully"
      );
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
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Create New Order
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600"
          >
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
              <div className="col-span-full md:col-span-1">
<<<<<<< HEAD
                <label className="block text-xs font-medium text-zinc-500 mb-1">
                  Phone Number
                </label>
=======
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Phone Number</label>
>>>>>>> edce87e5e6ba653643f3f4f3a114bbd41500da29
                <div className="relative">
                  <input
                    type="tel"
<<<<<<< HEAD
                    className={`w-full pl-3 pr-10 py-2 rounded-lg border bg-white dark:bg-zinc-800 outline-none transition-colors ${
                      selectedCustomerId
                        ? "border-green-500 ring-1 ring-green-500/20"
=======
                    className={`w-full pl-3 pr-10 py-2 rounded-lg border bg-white dark:bg-zinc-800 dark:text-white outline-none transition-colors ${
                      selectedCustomerId 
                        ? "border-green-500 ring-1 ring-green-500/20" 
>>>>>>> edce87e5e6ba653643f3f4f3a114bbd41500da29
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
<<<<<<< HEAD
                  <p className="text-xs text-green-600 mt-1.5 font-medium">
                    Existing customer found!
                  </p>
                )}
                {isNewCustomer && !checkingPhone && phoneSearch.length > 3 && (
                  <p className="text-xs text-blue-600 mt-1.5 font-medium">
                    New customer? Fill details below.
                  </p>
=======
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 font-medium">Existing customer found!</p>
                )}
                {isNewCustomer && !checkingPhone && phoneSearch.length > 3 && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5 font-medium">New customer? Fill details below.</p>
>>>>>>> edce87e5e6ba653643f3f4f3a114bbd41500da29
                )}
              </div>

              <div>
<<<<<<< HEAD
                <label className="block text-xs font-medium text-zinc-500 mb-1">
                  Customer Name
                </label>
                <input
=======
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Customer Name</label>
                <input 
>>>>>>> edce87e5e6ba653643f3f4f3a114bbd41500da29
                  type="text"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white disabled:bg-zinc-100 dark:disabled:bg-zinc-800/50 disabled:text-zinc-500"
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  disabled={!!selectedCustomerId}
                  required={isNewCustomer}
                />
              </div>

<<<<<<< HEAD
              <div
                className={`col-span-full grid grid-cols-1 md:grid-cols-2 gap-5 transition-all duration-300 ${
                  isNewCustomer || selectedCustomerId
                    ? "opacity-100 max-h-96"
                    : "opacity-0 max-h-0 hidden"
                }`}
              >
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    District
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-500"
                    value={customerDistrict}
                    onChange={(e) => setCustomerDistrict(e.target.value)}
                    disabled={!!selectedCustomerId}
                    required={isNewCustomer}
                  >
                    <option value="">Select District</option>
                    {WEST_BENGAL_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    Customer Type
                  </label>
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
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    Address (Optional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-500"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    disabled={!!selectedCustomerId}
                    placeholder="Full Address"
                  />
                </div>

                {/* NEW: Map Location Section (Only visible for New Customers) */}
                {isNewCustomer && (
                  <div className="col-span-full p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Map Location
                      </span>
                      <button
                        type="button"
                        onClick={handleAutoLocation}
                        disabled={geoLoading || !customerDistrict}
                        className="text-xs flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 disabled:opacity-50"
                      >
                        {geoLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <MapPin className="w-3 h-3" />
                        )}
                        Auto-Detect
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        step="any"
                        placeholder="Latitude"
                        className="w-full px-2 py-1.5 text-xs rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900"
                        value={customerLatitude}
                        onChange={(e) => setCustomerLatitude(e.target.value)}
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="Longitude"
                        className="w-full px-2 py-1.5 text-xs rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900"
                        value={customerLongitude}
                        onChange={(e) => setCustomerLongitude(e.target.value)}
                      />
                    </div>
                  </div>
                )}
=======
              <div className={`col-span-full grid grid-cols-1 md:grid-cols-2 gap-5 transition-all duration-300 ${isNewCustomer || selectedCustomerId ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 hidden'}`}>
                 <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">District</label>
                    <select 
                        className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white disabled:bg-zinc-100 dark:disabled:bg-zinc-800/50 disabled:text-zinc-500"
                        value={customerDistrict}
                        onChange={(e) => setCustomerDistrict(e.target.value)}
                        disabled={!!selectedCustomerId}
                        required={isNewCustomer}
                    >
                        <option value="">Select District</option>
                        {WEST_BENGAL_DISTRICTS.map((d) => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Customer Type</label>
                    <select 
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white disabled:bg-zinc-100 dark:disabled:bg-zinc-800/50 disabled:text-zinc-500"
                      value={customerType}
                      onChange={(e) => setCustomerType(e.target.value)}
                      disabled={!!selectedCustomerId}
                    >
                      <option value="SINGLE">Individual</option>
                      <option value="DISTRIBUTER">Distributor</option>
                    </select>
                 </div>
                 <div className="col-span-full">
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Address (Optional)</label>
                    <input 
                      type="text"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white disabled:bg-zinc-100 dark:disabled:bg-zinc-800/50 disabled:text-zinc-500"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      disabled={!!selectedCustomerId}
                      placeholder="Full Address"
                    />
                 </div>

                 {/* NEW: Map Location Section (Dark Mode Fixed) */}
                 {isNewCustomer && (
                   <div className="col-span-full p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Map Location</span>
                        <button
                          type="button"
                          onClick={handleAutoLocation}
                          disabled={geoLoading || !customerDistrict}
                          className="text-xs flex items-center gap-1 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50"
                        >
                          {geoLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                          Auto-Detect
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          step="any"
                          placeholder="Latitude"
                          className="w-full px-2 py-1.5 text-xs rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                          value={customerLatitude}
                          onChange={(e) => setCustomerLatitude(e.target.value)}
                        />
                        <input
                          type="number"
                          step="any"
                          placeholder="Longitude"
                          className="w-full px-2 py-1.5 text-xs rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                          value={customerLongitude}
                          onChange={(e) => setCustomerLongitude(e.target.value)}
                        />
                      </div>
                   </div>
                 )}
>>>>>>> edce87e5e6ba653643f3f4f3a114bbd41500da29
              </div>
            </div>
          </div>

          {/* Section 2: Order Details */}
          <div className="space-y-4">
<<<<<<< HEAD
            {/* ... (Rest of the order form remains unchanged) ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Delivery Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                  <input
                    type="date"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    required
                  />
=======
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Delivery Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                    <input 
                      type="date"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      required
                    />
                  </div>
>>>>>>> edce87e5e6ba653643f3f4f3a114bbd41500da29
                </div>
              </div>

<<<<<<< HEAD
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
=======
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Filter Products by Animal
                  </label>
                  <div className="relative">
                    <Filter className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                    <select 
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
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
>>>>>>> edce87e5e6ba653643f3f4f3a114bbd41500da29
                </div>
              </div>
            </div>

<<<<<<< HEAD
            {/* Items Table */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Order Items
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium bg-indigo-50 px-2 py-1 rounded"
                >
                  <Plus className="w-3 h-3" /> Add Item
                </button>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-zinc-500">
                        Item
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-zinc-500 w-24">
                        Bags
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-zinc-500 w-32">
                        Price/Bag
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-zinc-500 w-28">
                        Total
                      </th>
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
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "feedCategoryId",
                                e.target.value
                              )
                            }
                            required
                          >
                            <option value="">Select Feed</option>
                            {filteredFeedCategories.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name}{" "}
                                {!selectedAnimalType &&
                                  `(${f.animalType.name})`}
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
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "quantityBags",
                                Number(e.target.value)
                              )
                            }
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            className="w-full px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-transparent"
                            value={item.pricePerBag}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "pricePerBag",
                                Number(e.target.value)
                              )
                            }
                          />
                        </td>
                        <td className="p-2 text-right font-medium text-zinc-700 dark:text-zinc-300">
                          ₹
                          {(
                            item.quantityBags * item.pricePerBag
                          ).toLocaleString()}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Section */}
            <div className="flex flex-col items-end pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
              <div className="w-full md:w-80 space-y-2">
                <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
=======
             {/* Items Table */}
             <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Order Items</label>
                  <button type="button" onClick={addItem} className="text-xs flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </div>
                
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400">Item</th>
                        <th className="px-4 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400 w-24">Bags</th>
                        <th className="px-4 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400 w-32">Price/Bag</th>
                        <th className="px-4 py-2 text-right font-medium text-zinc-500 dark:text-zinc-400 w-28">Total</th>
                        <th className="px-4 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <select 
                              className="w-full px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-zinc-200"
                              value={item.feedCategoryId}
                              onChange={(e) => handleItemChange(idx, 'feedCategoryId', e.target.value)}
                              required
                            >
                              <option value="" className="dark:bg-zinc-800">Select Feed</option>
                              {filteredFeedCategories.map(f => (
                                <option key={f.id} value={f.id} className="dark:bg-zinc-800">
                                  {f.name} {!selectedAnimalType && `(${f.animalType.name})`}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input 
                              type="number" 
                              min="1"
                              className="w-full px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-zinc-200"
                              value={item.quantityBags}
                              onChange={(e) => handleItemChange(idx, 'quantityBags', Number(e.target.value))}
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              type="number" 
                              min="0"
                              className="w-full px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-zinc-200"
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
             </div>

             {/* Totals Section */}
             <div className="flex flex-col items-end pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                <div className="w-full md:w-80 space-y-2">
                   <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toLocaleString()}</span>
                   </div>
                   
                   <div className="flex items-center gap-2">
                      <select 
                        className="w-32 text-xs px-2 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                        value={discountType}
                        onChange={(e) => {
                          const type = e.target.value as any;
                          setDiscountType(type);
                          if (type === "NONE") setDiscountValue(0);
                        }}
                      >
                        <option value="NONE">No Discount</option>
                        <option value="FLAT">Flat (₹)</option>
                        <option value="PERCENTAGE">% Off</option>
                      </select>
                      <input 
                        type="number" 
                        min="0"
                        className="flex-1 text-xs px-2 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white disabled:opacity-50 disabled:bg-zinc-100 dark:disabled:bg-zinc-800/50"
                        placeholder="Value"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                        disabled={discountType === "NONE"}
                      />
                   </div>

                   <div className="flex justify-between text-lg font-bold text-zinc-900 dark:text-zinc-100 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-700">
                      <span>Total Amount</span>
                      <span>₹{finalAmount.toLocaleString()}</span>
                   </div>
>>>>>>> edce87e5e6ba653643f3f4f3a114bbd41500da29
                </div>

                <div className="flex items-center gap-2">
                  <select
                    className="w-32 text-xs px-2 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    value={discountType}
                    onChange={(e) => {
                      const type = e.target.value as any;
                      setDiscountType(type);
                      if (type === "NONE") setDiscountValue(0);
                    }}
                  >
                    <option value="NONE">No Discount</option>
                    <option value="FLAT">Flat (₹)</option>
                    <option value="PERCENTAGE">% Off</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    className="flex-1 text-xs px-2 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-50 disabled:bg-zinc-100 dark:disabled:bg-zinc-800/50"
                    placeholder="Value"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    disabled={discountType === "NONE"}
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
