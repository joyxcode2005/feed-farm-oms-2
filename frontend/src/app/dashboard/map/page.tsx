"use client";

import React, { useState, useMemo } from "react";
import {
  MapPin,
  Phone,
  X,
} from "lucide-react";
import * as d3 from "d3-geo";
import * as topojson from "topojson-client";

// Absolute imports using @ alias
import topologyData from "@/src/data/wb-topology.json";
import { DISTRICT_STYLES, api } from "@/src/config";

interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  type: "SINGLE" | "DISTRIBUTER";
  district: string;
}

export default function MapPage() {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<
    "ALL" | "SINGLE" | "DISTRIBUTER"
  >("ALL");

  // --- Map Calculation Logic ---
  const { mapFeatures, pathGenerator } = useMemo(() => {
    const geoJson = topojson.feature(
      topologyData as any,
      topologyData.objects["west-bengal"] as any
    ) as any;

    const width = 400;
    const height = 650;
    const projection = d3.geoMercator().fitSize([width, height], geoJson);
    const pathGenerator = d3.geoPath().projection(projection);

    return {
      mapFeatures:
        geoJson.type === "FeatureCollection" ? geoJson.features : [geoJson],
      pathGenerator,
    };
  }, []);

  const fetchCustomersByDistrict = async (district: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/customers?district=${district}`);
      setCustomers(res.data.customers || []);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDistrictClick = (districtName: string) => {
    setSelectedDistrict(districtName);
    setShowModal(true);
    fetchCustomersByDistrict(districtName);
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm);
      const matchesType = filterType === "ALL" || customer.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [customers, searchTerm, filterType]);

  const distributorCount = customers.filter(
    (c) => c.type === "DISTRIBUTER"
  ).length;
  const singleCount = customers.filter((c) => c.type === "SINGLE").length;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Regional Distribution Map
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          Interactive visualization of customer distribution across West Bengal.
        </p>
      </div>

      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
        <svg
          viewBox="0 0 400 650"
          className="w-full h-auto max-h-[70vh] mx-auto"
        >
          {mapFeatures.map((feature: any) => {
            const districtName = feature.properties.district;
            const isSelected = selectedDistrict === districtName;
            const colorClass =
              DISTRICT_STYLES[districtName] ||
              "fill-zinc-200 dark:fill-zinc-800";
            const pathData = pathGenerator(feature);

            if (!pathData) return null;

            return (
              <g
                key={districtName}
                className="group transition-all duration-300"
              >
                <path
                  d={pathData}
                  className={`cursor-pointer stroke-white dark:stroke-zinc-900 stroke-[0.5] transition-all ${colorClass} hover:brightness-110 ${
                    isSelected
                      ? "brightness-95 stroke-[1.5]"
                      : "opacity-90 hover:opacity-100"
                  }`}
                  onClick={() => handleDistrictClick(districtName)}
                />
                <text
                  transform={`translate(${pathGenerator.centroid(feature)})`}
                  fontSize="6"
                  className={`pointer-events-none font-bold uppercase fill-zinc-900 dark:fill-zinc-100 transition-opacity ${
                    isSelected
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                  textAnchor="middle"
                >
                  {districtName}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="mt-8 text-center pt-6 border-t border-zinc-100 dark:border-zinc-800">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-full text-xs font-medium text-zinc-500 border border-zinc-200 dark:border-zinc-700">
            <MapPin size={14} className="text-indigo-500" />
            {selectedDistrict
              ? `Viewing: ${selectedDistrict}`
              : "Click a district to view details"}
          </span>
        </div>
      </div>

      {showModal && selectedDistrict && (
        <DistrictModal
          district={selectedDistrict}
          customers={filteredCustomers}
          loading={loading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterType={filterType}
          setFilterType={setFilterType}
          distributorCount={distributorCount}
          singleCount={singleCount}
          onClose={() => {
            setShowModal(false);
            setSelectedDistrict(null);
            setCustomers([]);
            setSearchTerm("");
          }}
        />
      )}
    </div>
  );
}

// --- Internal Helper Component for Modal ---
function DistrictModal({
  district,
  customers,
  loading,
  searchTerm,
  setSearchTerm,
  distributorCount,
  singleCount,
  onClose,
}: any) {
  return (
    <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800">
        <div className="px-6 py-4 border-b dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="text-indigo-600" />
            <h3 className="text-xl font-bold">{district}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"
          >
            <X />
          </button>
        </div>

        <div className="p-6 bg-zinc-50/50 dark:bg-zinc-800/50 grid grid-cols-3 gap-4 border-b dark:border-zinc-800">
          <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border dark:border-zinc-800 text-center">
            <p className="text-[10px] text-zinc-500 uppercase font-bold">
              Total
            </p>
            <p className="text-xl font-bold">{customers.length}</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border dark:border-zinc-800 text-center">
            <p className="text-[10px] text-blue-500 uppercase font-bold">
              Distributors
            </p>
            <p className="text-xl font-bold">{distributorCount}</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border dark:border-zinc-800 text-center">
            <p className="text-[10px] text-emerald-500 uppercase font-bold">
              Single
            </p>
            <p className="text-xl font-bold">{singleCount}</p>
          </div>
        </div>

        <div className="p-4 flex gap-4 border-b dark:border-zinc-800">
          <input
            type="text"
            placeholder="Search regional customers..."
            className="flex-1 px-4 py-2 text-sm bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-lg outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">Loading...</div>
          ) : customers.length === 0 ? (
            <p className="text-center py-10 text-zinc-500">
              No customers found in this area.
            </p>
          ) : (
            customers.map((c: any) => (
              <div
                key={c.id}
                className="p-4 border dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 flex justify-between items-center"
              >
                <div>
                  <h4 className="font-bold">{c.name}</h4>
                  <p className="text-xs text-zinc-500 flex items-center gap-1">
                    <Phone size={10} /> {c.phone}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase border ${
                    c.type === "DISTRIBUTER"
                      ? "bg-blue-50 text-blue-600 border-blue-100"
                      : "bg-emerald-50 text-emerald-600 border-emerald-100"
                  }`}
                >
                  {c.type === "DISTRIBUTER" ? "Distributor" : "Single"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
