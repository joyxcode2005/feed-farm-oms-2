/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/src/config";
import toast from "react-hot-toast";
import { Plus, Search, MapPin, Users, User } from "lucide-react";
import CreateCustomerModal from "../components/CreateCustomerModal";

interface Customer {
  id: string;
  name: string;
  phone: string;
  type: "SINGLE" | "DISTRIBUTER";
  state: string | null;
  address: string | null;
}

export default function Customers() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState("");

  const fetchCustomers = async () => {
    try {
      const res = await api.get("/customers");
      setCustomers(res.data.customers || res.data.data); // Handle potential API variation
    } catch (error) {
      toast.error("Failed to fetch customers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Customers
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your client base, distributors, and farmers.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm font-medium rounded-lg hover:opacity-90 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Search & Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input 
          type="text"
          placeholder="Search by name or phone..."
          className="w-full sm:w-80 pl-9 pr-4 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-800 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-zinc-100 dark:bg-zinc-900 rounded-xl animate-pulse"></div>
          ))
        ) : filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => (
            <div 
              key={customer.id} 
              onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
              className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.98]"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-full ${customer.type === "DISTRIBUTER" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"}`}>
                    {customer.type === "DISTRIBUTER" ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                      {customer.name}
                    </h3>
                    <p className="text-xs text-zinc-500">{customer.type}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400 mt-3">
                <p className="flex items-center gap-2">
                  <span className="font-mono text-zinc-500 text-xs">PH:</span> 
                  {customer.phone}
                </p>
                {customer.state && (
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-zinc-400" />
                    {customer.state}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-zinc-500">
            No customers found matching your search.
          </div>
        )}
      </div>

      {isCreating && (
        <CreateCustomerModal
          onClose={() => setIsCreating(false)}
          onCreated={() => {
            setIsCreating(false);
            fetchCustomers();
          }}
        />
      )}
    </div>
  );
}