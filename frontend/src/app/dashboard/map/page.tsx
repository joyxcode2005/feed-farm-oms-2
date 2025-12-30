/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import L from "leaflet";
import * as topojson from "topojson-client";
import "leaflet/dist/leaflet.css";

import wbTopology from "@/src/data/wb-topology.json";
import { CustomerService } from "@/src/services/customer.service";
import { Loader2, IndianRupee, Package } from "lucide-react";

// --- Types for Map Data ---
interface MapCustomerData {
  id: string;
  name: string;
  phone: string;
  district: string;
  type: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  totalOrders: number;
  totalPaid: number;
  totalOutstanding: number;
}

const iconFix = () => {
  if (typeof window !== "undefined") {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    });
  }
};

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });
const GeoJSON = dynamic(() => import("react-leaflet").then((m) => m.GeoJSON), { ssr: false });

export default function MapPage() {
  const [customers, setCustomers] = useState<MapCustomerData[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const geoJsonData = useMemo(() => {
    return topojson.feature(wbTopology as any, wbTopology.objects["west-bengal"] as any);
  }, []);

  useEffect(() => {
    iconFix();
    const loadData = async () => {
      try {
        // Use getFinancialSummary to get coordinates AND payments info
        const data = await CustomerService.getFinancialSummary();
        // Cast or map the data to ensure types match
        setCustomers(data as unknown as MapCustomerData[]);
      } catch (err) {
        console.error("Failed to load map data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!selectedDistrict) return [];
    return customers.filter(
      (c) => c.district.toLowerCase() === selectedDistrict.toLowerCase()
    );
  }, [selectedDistrict, customers]);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] w-full">
      {/* Sidebar */}
      <div className="w-full md:w-80 bg-white border-r flex flex-col z-10">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-zinc-800">Intelligence Map</h2>
          <p className="text-sm text-zinc-500">
            {selectedDistrict ? `District: ${selectedDistrict}` : "Click a district on map"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-zinc-400"/></div>
          ) : filteredCustomers.length === 0 && selectedDistrict ? (
            <p className="text-sm text-zinc-400 text-center">No customers found in this district.</p>
          ) : filteredCustomers.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center">Select a district to view customer list.</p>
          ) : (
            filteredCustomers.map((c) => (
              <div
                key={c.id}
                className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 hover:border-blue-400 hover:shadow-sm transition-all group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-zinc-800 text-sm">{c.name}</p>
                    <p className="text-[10px] text-zinc-500 line-clamp-1">{c.address || "No Address"}</p>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${c.type === 'DISTRIBUTER' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {c.type === 'SINGLE' ? 'Ind' : 'Dist'}
                  </span>
                </div>

                {/* Financial Stats in Sidebar */}
                <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-400 font-medium uppercase flex items-center gap-1">
                      <IndianRupee className="w-3 h-3"/> Total Paid
                    </span>
                    <span className="text-xs font-bold text-emerald-600">
                      ₹{c.totalPaid.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className="text-[10px] text-zinc-400 font-medium uppercase flex items-center gap-1">
                      <Package className="w-3 h-3"/> Orders
                    </span>
                    <span className="text-xs font-bold text-zinc-700">
                      {c.totalOrders}
                    </span>
                  </div>
                </div>

                {(!c.latitude || !c.longitude) && (
                  <div className="mt-1 text-[9px] text-red-400 text-right italic">No Map Location</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Map Section */}
      <div className="flex-1 bg-zinc-100 relative">
        <MapContainer center={[22.9868, 87.855]} zoom={7} className="h-full w-full outline-none">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* District Boundaries */}
          {geoJsonData && (
            <GeoJSON
              data={geoJsonData as any}
              style={(feature) => ({
                fillColor: feature?.properties.district === selectedDistrict ? "#3b82f6" : "#64748b",
                weight: 1,
                color: "white",
                fillOpacity: feature?.properties.district === selectedDistrict ? 0.4 : 0.1,
              })}
              onEachFeature={(feature, layer) => {
                layer.on("click", () => {
                  setSelectedDistrict(feature.properties.district);
                });
                // Simple hover effect
                layer.on("mouseover", (e) => {
                  const l = e.target;
                  l.setStyle({ weight: 2, fillOpacity: 0.5 });
                });
                layer.on("mouseout", (e) => {
                  const l = e.target;
                  // Only reset if not selected
                  if (feature.properties.district !== selectedDistrict) {
                     l.setStyle({ weight: 1, fillOpacity: 0.1 });
                  }
                });
              }}
            />
          )}

          {/* Customer Markers */}
          {customers.map((c) => {
            if (!c.latitude || !c.longitude) return null;
            return (
              <Marker key={c.id} position={[c.latitude, c.longitude]}>
                <Popup>
                  <div className="min-w-[150px]">
                    <h3 className="font-bold text-sm border-b pb-1 mb-1">{c.name}</h3>
                    <p className="text-xs text-zinc-500 mb-2">{c.address || c.district}</p>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <span className="text-zinc-500">Total Paid:</span>
                      <span className="font-bold text-emerald-600 text-right">₹{c.totalPaid.toLocaleString()}</span>
                      
                      <span className="text-zinc-500">Orders:</span>
                      <span className="font-bold text-zinc-700 text-right">{c.totalOrders}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}