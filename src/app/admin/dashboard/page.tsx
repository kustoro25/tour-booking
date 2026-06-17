'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  pendingBookings: number;
  totalTours: number;
  totalReviews: number;
  recentBookings: Array<{
    id: string;
    invoiceNo: string;
    customerName: string;
    tour: { name: string };
    status: string;
    total: number;
    createdAt: string;
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [bookingsRes, toursRes, reviewsRes] = await Promise.all([
        fetch('/api/admin/bookings?limit=5'),
        fetch('/api/admin/tours'),
        fetch('/api/admin/reviews'),
      ]);

      const bookings = await bookingsRes.json();
      const tours = await toursRes.json();
      const reviews = await reviewsRes.json();

      const allBookings = bookings.data || [];
      const totalRevenue = allBookings
        .filter((b: { status: string }) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
        .reduce((sum: number, b: { total: number }) => sum + b.total, 0);

      setStats({
        totalBookings: bookings.total || allBookings.length,
        totalRevenue,
        pendingBookings: allBookings.filter((b: { status: string }) => b.status === 'PENDING').length,
        totalTours: tours.total || tours.data?.length || 0,
        totalReviews: reviews.total || reviews.data?.length || 0,
        recentBookings: allBookings.slice(0, 5),
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Booking', value: stats?.totalBookings || 0, color: 'bg-blue-500', icon: '📋' },
          { label: 'Revenue', value: formatCurrency(stats?.totalRevenue || 0), color: 'bg-green-500', icon: '💰' },
          { label: 'Menunggu Bayar', value: stats?.pendingBookings || 0, color: 'bg-orange-500', icon: '⏳' },
          { label: 'Paket Tour', value: stats?.totalTours || 0, color: 'bg-purple-500', icon: '🏝️' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
              <span className={`w-3 h-3 rounded-full ${stat.color}`} />
            </div>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/admin/tours/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + Tambah Paket Tour
        </Link>
        <Link href="/admin/bookings" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
          Lihat Semua Booking
        </Link>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Booking Terbaru</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Tamu</th>
                <th className="px-4 py-3 font-medium">Paket</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.recentBookings?.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{booking.invoiceNo}</td>
                  <td className="px-4 py-3">{booking.customerName}</td>
                  <td className="px-4 py-3 text-gray-500">{booking.tour.name}</td>
                  <td className="px-4 py-3">{formatCurrency(booking.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      booking.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                      booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                      booking.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/bookings/${booking.id}`} className="text-blue-600 hover:text-blue-700 text-xs">
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
              {(!stats?.recentBookings || stats.recentBookings.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Belum ada booking</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
