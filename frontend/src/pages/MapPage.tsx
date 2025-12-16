/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useMemo } from 'react';
import { Search, MapPin, Users, Building2, Phone, X, LayoutGrid } from 'lucide-react';
import * as d3 from 'd3-geo';
import * as topojson from 'topojson-client';
// @ts-ignore
import topologyData from '../data/wb-topology.json'; // Make sure this path matches where you saved the file

const API_BASE = 'http://localhost:8080/api/v1/admin';

// --- District Color Mapping ---
// We map the exact names from your JSON properties to colors
const DISTRICT_STYLES: Record<string, string> = {
  'Darjeeling': 'fill-cyan-400',
  'Kalimpong': 'fill-sky-400',
  'Jalpaiguri': 'fill-yellow-400',
  'Alipurduar': 'fill-teal-400',
  'Cooch Behar': 'fill-orange-400',
  'Uttar Dinajpur': 'fill-indigo-400',
  'Dakshin Dinajpur': 'fill-fuchsia-400',
  'Maldah': 'fill-rose-300',
  'Murshidabad': 'fill-yellow-300',
  'Birbhum': 'fill-blue-400',
  'Nadia': 'fill-green-400',
  'Purba Bardhaman': 'fill-orange-300',
  'Paschim Bardhaman': 'fill-amber-400',
  'Hooghly': 'fill-cyan-300',
  'North 24 Parganas': 'fill-pink-400',
  'South 24 Parganas': 'fill-lime-300',
  'Kolkata': 'fill-red-500',
  'Howrah': 'fill-green-300',
  'Bankura': 'fill-emerald-400',
  'Purulia': 'fill-violet-400',
  'Medinipur West': 'fill-blue-500', // Paschim Medinipur in your JSON
  'Medinipur East': 'fill-orange-500', // Purba Medinipur in your JSON
  'Jhargram': 'fill-purple-400',
};

interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  type: 'SINGLE' | 'DISTRIBUTER';
  state?: string;
}

export default function MapPage() {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'SINGLE' | 'DISTRIBUTER'>('ALL');
  const [showModal, setShowModal] = useState(false);

  // --- Map Calculation Logic ---
  const { mapFeatures, pathGenerator } = useMemo(() => {
    // 1. Convert TopoJSON to GeoJSON
    // @ts-ignore
    const geoJson = topojson.feature(topologyData, topologyData.objects['west-bengal']);

    // 2. Setup Projection (Fit the map to a 400x600 box)
    const width = 400;
    const height = 650;
    
    const projection = d3.geoMercator()
      .fitSize([width, height], geoJson);
      
    const pathGenerator = d3.geoPath().projection(projection);

    return { mapFeatures: geoJson.features, pathGenerator };
  }, []);


  const fetchCustomersByDistrict = async (district: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/customers?state=${district}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
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

  // --- Filtering Logic ---
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.phone.includes(searchTerm);
      const matchesType = filterType === 'ALL' || customer.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [customers, searchTerm, filterType]);

  const distributorCount = customers.filter(c => c.type === 'DISTRIBUTER').length;
  const singleCount = customers.filter(c => c.type === 'SINGLE').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-3">
            Regional Distribution <span className="text-indigo-600 dark:text-indigo-400">Map</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
            Interactive visualization of customer distribution across West Bengal.
          </p>
        </div>

        {/* Map Container */}
        <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden border border-slate-100 dark:border-slate-800 p-8">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#4f46e5_1px,transparent_1px)] bg-size-[16px_16px]"></div>
          
          <svg
            viewBox="0 0 400 650"
            className="w-full h-auto max-h-[75vh] mx-auto filter drop-shadow-lg"
          >
            {mapFeatures.map((feature: any) => {
              const districtName = feature.properties.district;
              const isSelected = selectedDistrict === districtName;
              const colorClass = DISTRICT_STYLES[districtName] || 'fill-slate-200'; // Fallback color
              const pathData = pathGenerator(feature);

              if (!pathData) return null;

              return (
                <g key={districtName} className="group transition-all duration-300 ease-out">
                  <path
                    d={pathData}
                    className={`
                      cursor-pointer stroke-white stroke-[0.5] transition-all duration-300
                      ${colorClass} hover:brightness-110
                      ${isSelected ? 'brightness-90 stroke-[1.5] -translate-y-0.5 drop-shadow-xl z-10' : 'opacity-90 hover:opacity-100 hover:-translate-y-0.5 hover:drop-shadow-md'}
                    `}
                    onClick={() => handleDistrictClick(districtName)}
                  />
                  {/* Label Logic: Calculate centroid for text placement */}
                  <text
                    transform={`translate(${pathGenerator.centroid(feature)})`}
                    fontSize="5"
                    className={`
                      pointer-events-none font-medium uppercase tracking-wider
                      transition-all duration-300 fill-slate-900 text-center
                      ${isSelected ? 'opacity-100 font-bold' : 'opacity-0 group-hover:opacity-100'}
                    `}
                    textAnchor="middle"
                    style={{ userSelect: 'none', textShadow: '0px 0px 4px rgba(255,255,255,0.9)' }}
                  >
                    {districtName}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-800 pt-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-full text-sm text-slate-500 dark:text-slate-400 font-medium border border-slate-200 dark:border-slate-700">
              <MapPin size={16} className="text-indigo-500" />
              {selectedDistrict 
                ? `Currently Viewing: ${selectedDistrict}` 
                : 'Click any district to view customer data'}
            </span>
          </div>
        </div>

        {/* Modal Overlay (Same as before) */}
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
              setSearchTerm('');
              setFilterType('ALL');
            }}
          />
        )}
      </div>
    </div>
  );
}

// --- Helper Components ---

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
}

function DistrictModal({
  district,
  customers,
  loading,
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  distributorCount,
  singleCount,
  onClose,
}: any) { // Kept 'any' for brevity, use full types from previous response if needed
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-700">
        
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                <MapPin className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{district}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Regional Overview</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mt-8">
             <div className="col-span-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-1">
                <LayoutGrid className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total</span>
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{customers.length}</div>
            </div>
            <div className="col-span-1 bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
              <div className="flex items-center gap-3 mb-1">
                <Building2 className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Distributors</span>
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-100">{distributorCount}</div>
            </div>
            <div className="col-span-1 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/30">
              <div className="flex items-center gap-3 mb-1">
                <Users className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Single</span>
              </div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-100">{singleCount}</div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-8 py-4 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between backdrop-blur-sm">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>

          <div className="flex p-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            {(['ALL', 'DISTRIBUTER', 'SINGLE'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                  filterType === type
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {type === 'DISTRIBUTER' ? 'DISTRIBUTORS' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30 dark:bg-slate-900/50">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 animate-pulse">
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full mb-4"></div>
              <p>Fetching regional data...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Users className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium text-slate-500">No customers found</p>
              <p className="text-sm">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customers.map((customer: any) => (
                <div
                  key={customer.id}
                  className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-200 relative overflow-hidden"
                >
                   <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                     customer.type === 'DISTRIBUTER' ? 'bg-blue-500' : 'bg-emerald-500'
                   }`} />

                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                       customer.type === 'DISTRIBUTER' 
                       ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200' 
                       : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200'
                    }`}>
                      {getInitials(customer.name)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate pr-2">
                          {customer.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                          customer.type === 'DISTRIBUTER'
                            ? 'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                            : 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300'
                        }`}>
                          {customer.type === 'DISTRIBUTER' ? 'Distributor' : 'Single'}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                          <Phone className="w-3.5 h-3.5" />
                          <span className="font-mono">{customer.phone}</span>
                        </div>
                        {customer.address && (
                          <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <p className="line-clamp-2 text-xs">{customer.address}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}