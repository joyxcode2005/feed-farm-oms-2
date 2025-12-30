/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import L from "leaflet";
import * as topojson from "topojson-client";

// Leaflet CSS is mandatory for markers to show
import "leaflet/dist/leaflet.css";

import wbTopology from "@/src/data/wb-topology.json";
import { Customer } from "@/src/types";
import { CustomerService } from "@/src/services/customer.service";

// --- Fix Leaflet Marker Icons ---
const iconFix = () => {
  if (typeof window !== "undefined") {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    });
  }
};

// --- Dynamic Imports for Next.js ---
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), {
  ssr: false,
});
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), {
  ssr: false,
});
const GeoJSON = dynamic(() => import("react-leaflet").then((m) => m.GeoJSON), {
  ssr: false,
});

export default function MapPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  // Convert TopoJSON to GeoJSON for Leaflet
  const geoJsonData = useMemo(() => {
    return topojson.feature(
      wbTopology as any,
      wbTopology.objects["west-bengal"] as any
    );
  }, []);

  useEffect(() => {
    iconFix();
    const loadData = async () => {
      try {
        const data = await CustomerService.getAll();
        console.log("Loaded Customers:", data); // Check console for lat/lng values
        setCustomers(data);
      } catch (err) {
        console.error("Failed to load customers", err);
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
      <div className="w-full md:w-80 bg-white border-r p-4 overflow-y-auto z-10">
        <h2 className="text-xl font-bold mb-1">Intelligence Map</h2>
        <p className="text-sm text-gray-500 mb-4">
          {selectedDistrict
            ? `District: ${selectedDistrict}`
            : "Click a district to see customers"}
        </p>

        <div className="space-y-3">
          {filteredCustomers.map((c) => (
            <div
              key={c.id}
              className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-300 transition-colors"
            >
              <p className="font-bold text-gray-800">{c.name}</p>
              <p className="text-xs text-gray-500">
                {c.address || "No Address"}
              </p>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-[9px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-bold uppercase">
                  {c.type}
                </span>
                {(!c.latitude || !c.longitude) && (
                  <span className="text-[9px] text-red-500 italic">
                    No GPS Data
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map Section */}
      <div className="flex-1 bg-gray-100">
        <MapContainer
          center={[22.9868, 87.855]}
          zoom={7}
          className="h-full w-full"
        >
          {/* Replace your current TileLayer with this */}
          <TileLayer
            attribution="&copy; Google"
            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" // 'm' is for standard roadmap
            // Use "lyrs=s,h" for hybrid (satellite + landmarks)
            // Use "lyrs=y" for hybrid (better for landmarks)
          />

          {/* District Boundaries */}
          {geoJsonData && (
            <GeoJSON
              data={geoJsonData as any}
              style={(feature) => ({
                fillColor:
                  feature?.properties.district === selectedDistrict
                    ? "#3b82f6"
                    : "#94a3b8",
                weight: 1,
                color: "white",
                fillOpacity:
                  feature?.properties.district === selectedDistrict ? 0.5 : 0.2,
              })}
              onEachFeature={(feature, layer) => {
                layer.on("click", () =>
                  setSelectedDistrict(feature.properties.district)
                );
              }}
            />
          )}

          {/* Customer Markers - Only show if lat/lng exist */}
          {customers.map((c) => {
            if (!c.latitude || !c.longitude) return null;
            return (
              <Marker key={c.id} position={[c.latitude, c.longitude]}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold">{c.name}</p>
                    <p className="text-gray-600">{c.district}</p>
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
