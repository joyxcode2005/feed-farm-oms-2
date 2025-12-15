'use client';

import React, { useState } from 'react';
import { Search, MapPin, Users, Building2, Phone, X } from 'lucide-react';

const API_BASE = 'http://localhost:8080/api/v1/admin';

interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  type: 'SINGLE' | 'DISTRIBUTER';
  state?: string;
  latitude?: number;
  longitude?: number;
}

// West Bengal districts with their coordinates for the map
const WB_DISTRICTS = [
  { name: 'Darjeeling', path: 'M 150,50 L 200,50 L 210,80 L 180,90 L 150,80 Z' },
  { name: 'Kalimpong', path: 'M 210,50 L 240,50 L 250,75 L 210,80 Z' },
  { name: 'Jalpaiguri', path: 'M 200,90 L 250,85 L 270,110 L 240,125 L 200,120 Z' },
  { name: 'Alipurduar', path: 'M 250,85 L 290,80 L 300,100 L 270,110 Z' },
  { name: 'Cooch Behar', path: 'M 240,125 L 280,120 L 300,145 L 260,155 Z' },
  { name: 'North Dinajpur', path: 'M 200,130 L 240,125 L 260,155 L 230,175 L 190,165 Z' },
  { name: 'South Dinajpur', path: 'M 190,165 L 230,175 L 240,200 L 200,210 L 170,195 Z' },
  { name: 'Malda', path: 'M 170,195 L 200,210 L 210,240 L 180,250 L 150,235 Z' },
  { name: 'Murshidabad', path: 'M 150,235 L 180,250 L 200,290 L 170,310 L 140,295 Z' },
  { name: 'Birbhum', path: 'M 140,295 L 170,310 L 180,345 L 150,360 L 120,345 Z' },
  { name: 'Nadia', path: 'M 170,310 L 200,290 L 220,320 L 200,350 L 170,340 Z' },
  { name: 'Burdwan East', path: 'M 120,345 L 150,360 L 160,390 L 130,405 L 100,390 Z' },
  { name: 'Burdwan West', path: 'M 100,390 L 130,405 L 140,435 L 110,450 L 80,435 Z' },
  { name: 'Hooghly', path: 'M 150,360 L 180,365 L 190,395 L 160,410 L 150,390 Z' },
  { name: 'North 24 Parganas', path: 'M 180,365 L 220,360 L 240,390 L 220,415 L 190,410 Z' },
  { name: 'Kolkata', path: 'M 200,410 L 220,410 L 225,425 L 205,430 Z' },
  { name: 'South 24 Parganas', path: 'M 190,410 L 220,415 L 230,450 L 210,480 L 180,470 L 170,440 Z' },
  { name: 'Howrah', path: 'M 160,410 L 190,410 L 195,435 L 170,445 L 155,430 Z' },
  { name: 'Bankura', path: 'M 80,435 L 110,450 L 120,485 L 90,500 L 60,485 Z' },
  { name: 'Purulia', path: 'M 40,450 L 80,435 L 90,465 L 70,490 L 40,480 Z' },
  { name: 'Paschim Medinipur', path: 'M 60,485 L 90,500 L 100,535 L 70,550 L 40,535 Z' },
  { name: 'Jhargram', path: 'M 40,535 L 70,550 L 80,580 L 50,595 L 30,575 Z' },
  { name: 'Purba Medinipur', path: 'M 100,535 L 130,540 L 150,575 L 130,600 L 100,590 L 80,580 Z' },
];

export default function MapPage() {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'SINGLE' | 'DISTRIBUTER'>('ALL');
  const [showModal, setShowModal] = useState(false);

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

  const handleDistrictClick = (district: string) => {
    setSelectedDistrict(district);
    setShowModal(true);
    fetchCustomersByDistrict(district);
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm);
    const matchesType = filterType === 'ALL' || customer.type === filterType;
    return matchesSearch && matchesType;
  });

  const distributorCount = customers.filter(c => c.type === 'DISTRIBUTER').length;
  const singleCount = customers.filter(c => c.type === 'SINGLE').length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            West Bengal Distribution Map
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Click on any district to view customers and distributors in that area
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8">
          <svg
            viewBox="0 0 350 650"
            className="w-full max-w-2xl mx-auto"
            style={{ maxHeight: '70vh' }}
          >
            <defs>
              <filter id="shadow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
              </filter>
            </defs>
            
            {WB_DISTRICTS.map((district) => (
              <g key={district.name}>
                <path
                  d={district.path}
                  fill={selectedDistrict === district.name ? '#18181b' : '#f4f4f5'}
                  stroke="#3f3f46"
                  strokeWidth="1.5"
                  className="cursor-pointer transition-all duration-200 hover:fill-zinc-300 dark:hover:fill-zinc-700"
                  style={{ filter: 'url(#shadow)' }}
                  onClick={() => handleDistrictClick(district.name)}
                />
                <text
                  x={getPathCenter(district.path).x}
                  y={getPathCenter(district.path).y}
                  fontSize="8"
                  fill={selectedDistrict === district.name ? '#ffffff' : '#18181b'}
                  textAnchor="middle"
                  className="pointer-events-none text-xs"
                  style={{ userSelect: 'none' }}
                >
                  {district.name}
                </text>
              </g>
            ))}
          </svg>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {selectedDistrict 
                ? `Selected: ${selectedDistrict}` 
                : 'Click on a district to view details'}
            </p>
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
              setSearchTerm('');
              setFilterType('ALL');
            }}
          />
        )}
      </div>
    </div>
  );
}

function getPathCenter(path: string): { x: number; y: number } {
  const numbers = path.match(/[\d.]+/g)?.map(Number) || [];
  const xCoords = numbers.filter((_, i) => i % 2 === 0);
  const yCoords = numbers.filter((_, i) => i % 2 === 1);
  
  return {
    x: xCoords.reduce((a, b) => a + b, 0) / xCoords.length,
    y: yCoords.reduce((a, b) => a + b, 0) / yCoords.length,
  };
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
}: {
  district: string;
  customers: Customer[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterType: 'ALL' | 'SINGLE' | 'DISTRIBUTER';
  setFilterType: (value: 'ALL' | 'SINGLE' | 'DISTRIBUTER') => void;
  distributorCount: number;
  singleCount: number;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <MapPin className="w-6 h-6" />
              {district}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Total Customers: {customers.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Distributors</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{distributorCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Single Customers</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{singleCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-700"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'ALL'
                  ? 'bg-zinc-900 dark:bg-zinc-800 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              All ({customers.length})
            </button>
            <button
              onClick={() => setFilterType('DISTRIBUTER')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'DISTRIBUTER'
                  ? 'bg-zinc-900 dark:bg-zinc-800 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              Distributors ({distributorCount})
            </button>
            <button
              onClick={() => setFilterType('SINGLE')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'SINGLE'
                  ? 'bg-zinc-900 dark:bg-zinc-800 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              Single ({singleCount})
            </button>
          </div>
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-zinc-600 dark:text-zinc-400">
              Loading customers...
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-zinc-600 dark:text-zinc-400">
              No customers found in {district}
            </div>
          ) : (
            <div className="space-y-3">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                          {customer.name}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          customer.type === 'DISTRIBUTER'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        }`}>
                          {customer.type === 'DISTRIBUTER' ? 'Distributor' : 'Single'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <Phone className="w-4 h-4" />
                        {customer.phone}
                      </div>
                      {customer.address && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                          {customer.address}
                        </p>
                      )}
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