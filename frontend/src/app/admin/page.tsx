/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, LayoutDashboard, Trash2, Edit2, X } from 'lucide-react';

type AdminRole = 'SUPER_ADMIN' | 'ADMIN';

interface Admin {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
}

const API_BASE = 'http://localhost:8080/api/v1/admin/auth'; // Update to your backend URL

export default function AdminDashboard() {
  const router = useRouter();
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'settings'>('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_BASE}/info`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentAdmin(data.admin);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!currentAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Feed Management System
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {currentAdmin.name}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 min-h-[calc(100vh-4rem)] bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentPage === 'dashboard'
                  ? 'bg-zinc-900 dark:bg-zinc-800 text-white'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </button>
            {currentAdmin.role === 'SUPER_ADMIN' && (
              <button
                onClick={() => setCurrentPage('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentPage === 'settings'
                    ? 'bg-zinc-900 dark:bg-zinc-800 text-white'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Settings className="w-5 h-5" />
                Admin Settings
              </button>
            )}
          </nav>
        </aside>

        <main className="flex-1 p-8">
          {currentPage === 'dashboard' ? (
            <DashboardPage admin={currentAdmin} />
          ) : (
            <SettingsPage admin={currentAdmin} />
          )}
        </main>
      </div>
    </div>
  );
}

function DashboardPage({ admin }: { admin: Admin }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-6">
        Dashboard
      </h2>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Name</p>
            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">{admin.name}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Email</p>
            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">{admin.email}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Phone</p>
            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">{admin.phone}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Role</p>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50">
              {admin.role}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPage({ admin }: { admin: Admin }) {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await fetch(`${API_BASE}/all`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setAdmins(data.adminUsers);
      }
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this admin?')) return;

    try {
      const response = await fetch(`${API_BASE}/delete/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchAdmins();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete admin');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete admin');
    }
  };

  const handleEdit = (admin: Admin) => {
    setEditingAdmin(admin);
    setShowEditModal(true);
  };

  const handleUpdate = async (updatedData: Partial<Admin>) => {
    try {
      const response = await fetch(`${API_BASE}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        setShowEditModal(false);
        fetchAdmins();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update admin');
      }
    } catch (error) {
      console.error('Update failed:', error);
      alert('Failed to update admin');
    }
  };

  if (loading) {
    return <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Admin Management
        </h2>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {admins.map((a) => (
              <tr key={a.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-50">
                  {a.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                  {a.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                  {a.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50">
                    {a.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    {a.id === admin.id && (
                      <button
                        onClick={() => handleEdit(a)}
                        className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {a.role === 'ADMIN' && admin.role === 'SUPER_ADMIN' && (
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showEditModal && editingAdmin && (
        <EditAdminModal
          admin={editingAdmin}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}

function EditAdminModal({
  admin,
  onClose,
  onUpdate,
}: {
  admin: Admin;
  onClose: () => void;
  onUpdate: (data: Partial<Admin>) => void;
}) {
  const [formData, setFormData] = useState({
    name: admin.name,
    email: admin.email,
    phone: admin.phone,
  });

  const handleSubmit = () => {
    onUpdate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Edit Admin Details
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-700"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-700"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-700"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-zinc-900 dark:bg-zinc-800 text-white rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}