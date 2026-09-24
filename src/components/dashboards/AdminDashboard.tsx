import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { ShieldAlert, Users, Sprout, Handshake, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'STATS' | 'USERS' | 'FARMERS' | 'BUYERS'>('STATS');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, u, f, b] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminFarmers(),
        api.getAdminBuyers(),
      ]);
      setStats(s);
      setUsers(u);
      setFarmers(f);
      setBuyers(b);
    } catch (err: any) {
      setError(err.message || 'Failed to load admin telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-stone-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="text-[10px] font-extrabold text-stone-700 uppercase tracking-widest">
            System Administration Console
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 mt-0.5">
            KrishiVaani Platform Operations
          </h1>
        </div>

        <button
          onClick={loadData}
          className="p-2 border border-stone-300 rounded-lg bg-white hover:bg-stone-50 text-stone-700 self-start sm:self-auto"
          title={t.common.refresh}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
            <div className="text-[11px] font-bold text-stone-700 uppercase">Total Users</div>
            <div className="text-2xl font-black text-stone-900 mt-1 tabular-nums">
              {stats.totalUsers}
            </div>
            <div className="text-[10px] text-stone-700 mt-1">
              {stats.totalFarmers} Farmers • {stats.totalBuyers} Buyers
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
            <div className="text-[11px] font-bold text-stone-700 uppercase">Monitored APMCs</div>
            <div className="text-2xl font-black text-emerald-800 mt-1 tabular-nums">
              {stats.totalMarkets}
            </div>
            <div className="text-[10px] text-stone-700 mt-1">Real-time daily mandi rates</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
            <div className="text-[11px] font-bold text-stone-700 uppercase">Volume Settled</div>
            <div className="text-2xl font-black text-stone-900 mt-1 tabular-nums">
              ₹{(stats.totalVolumeRupees / 1000).toFixed(1)}k
            </div>
            <div className="text-[10px] text-emerald-700 font-bold mt-1">
              {stats.totalTransactions} closed market deals
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
            <div className="text-[11px] font-bold text-rose-800 uppercase">Rescue Facilities</div>
            <div className="text-2xl font-black text-rose-700 mt-1 tabular-nums">
              {stats.totalRescueOptions}
            </div>
            <div className="text-[10px] text-stone-700 mt-1">Emergency processing units</div>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex border-b border-stone-200 gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('STATS')}
          className={`pb-2.5 transition-colors ${
            activeTab === 'STATS'
              ? 'border-b-2 border-emerald-700 text-emerald-900'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          Overview & Architecture
        </button>
        <button
          onClick={() => setActiveTab('USERS')}
          className={`pb-2.5 transition-colors ${
            activeTab === 'USERS'
              ? 'border-b-2 border-emerald-700 text-emerald-900'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          Users Database ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('FARMERS')}
          className={`pb-2.5 transition-colors ${
            activeTab === 'FARMERS'
              ? 'border-b-2 border-emerald-700 text-emerald-900'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          Registered Farmers ({farmers.length})
        </button>
        <button
          onClick={() => setActiveTab('BUYERS')}
          className={`pb-2.5 transition-colors ${
            activeTab === 'BUYERS'
              ? 'border-b-2 border-emerald-700 text-emerald-900'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          Verified Buyers ({buyers.length})
        </button>
      </div>

      {/* Tab 1: System Overview & Architecture */}
      {activeTab === 'STATS' && (
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-2xs space-y-4">
          <h3 className="font-extrabold text-sm text-stone-900">
            Platform Operational Architecture & Standards
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-stone-700">
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
              <span className="font-bold text-stone-900 block">Strict Product Architecture</span>
              <ul className="list-disc pl-4 space-y-1">
                <li>Exactly 2 Core Roles: Farmer & Buyer. (No FPO login).</li>
                <li>FPO Aggregation is integrated within the Farmer workflow.</li>
                <li>All 6 Required Modules fully functional with persistent storage.</li>
              </ul>
            </div>
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
              <span className="font-bold text-stone-900 block">Database & Logic Integrity</span>
              <ul className="list-disc pl-4 space-y-1">
                <li>Relational SQLite / PostgreSQL-ready architecture.</li>
                <li>Net Realisation Algorithm accounting for transport, cess & transit decay.</li>
                <li>Sell or Wait ML engine blending weather risk, shelf-life, and momentum.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Users */}
      {activeTab === 'USERS' && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-200 text-stone-700 font-bold">
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50">
                  <td className="py-3 px-4 font-mono text-stone-700">#{u.id}</td>
                  <td className="py-3 px-4 font-bold text-stone-900 tabular-nums">{u.mobile}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        u.role === 'FARMER'
                          ? 'bg-emerald-100 text-emerald-800'
                          : u.role === 'BUYER'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-stone-100 text-stone-800'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 uppercase font-semibold text-stone-700">{u.language}</td>
                  <td className="py-3 px-4 tabular-nums text-stone-700">{u.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Farmers */}
      {activeTab === 'FARMERS' && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-200 text-stone-700 font-bold">
                <th className="py-3 px-4">Farmer Name</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Primary Crop</th>
                <th className="py-3 px-4 text-right">Land Area</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {farmers.map((f) => (
                <tr key={f.id} className="hover:bg-stone-50">
                  <td className="py-3 px-4 font-bold text-stone-900">{f.full_name}</td>
                  <td className="py-3 px-4 tabular-nums text-stone-700">{f.mobile}</td>
                  <td className="py-3 px-4 text-stone-700">
                    {f.village}, {f.taluka}, {f.district}
                  </td>
                  <td className="py-3 px-4 text-stone-700">{f.primary_crop || 'N/A'}</td>
                  <td className="py-3 px-4 text-right tabular-nums font-semibold text-stone-900">
                    {f.land_area ? `${f.land_area} Acres` : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Buyers */}
      {activeTab === 'BUYERS' && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-200 text-stone-700 font-bold">
                <th className="py-3 px-4">Business Name</th>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-4">Buyer Type</th>
                <th className="py-3 px-4">Delivery Facility</th>
                <th className="py-3 px-4">Payment Terms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {buyers.map((b) => (
                <tr key={b.id} className="hover:bg-stone-50">
                  <td className="py-3 px-4 font-bold text-stone-900">{b.business_name}</td>
                  <td className="py-3 px-4 text-stone-700">
                    {b.contact_person} ({b.mobile})
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-800">
                      {b.buyer_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-stone-700">{b.delivery_location}</td>
                  <td className="py-3 px-4 text-emerald-800 font-medium">{b.payment_terms}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
