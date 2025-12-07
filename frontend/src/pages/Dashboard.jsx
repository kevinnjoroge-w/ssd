import React, { useEffect, useState } from 'react'
import { FiLoader, FiAlertCircle } from 'react-icons/fi'
import api from '../utils/api'
import StatsCard from '../components/StatsCard'
import PaymentsChart from '../components/PaymentsChart'

export default function Dashboard(){
  const [stats, setStats] = useState({ users:0, policies:0, payments:0 })
  const [recentPayments, setRecentPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(()=>{
    const load = async ()=>{
      try{
        setError(null)
        // Attempt to fetch plans, users, and payments from backend
        const plansRes = await api.get('/api/ussd/plans')
        const plansCount = Array.isArray(plansRes.data?.data) ? plansRes.data.data.length : 0

        // Many backends won't expose user count by default; try /api/users if available
        let usersCount = 0
        try{
          const usersRes = await api.get('/api/users')
          usersCount = Array.isArray(usersRes.data) ? usersRes.data.length : 0
        } catch(e){ /* ignore if endpoint not present */ }

        // payments history
        let paymentsCount = 0
        let paymentsList = []
        try{
          const payRes = await api.get('/api/payments/history')
          paymentsList = payRes.data?.data || []
          paymentsCount = paymentsList.length
        } catch(e){ /* ignore */ }

        setStats({ users: usersCount, policies: plansCount, payments: paymentsCount })
        setRecentPayments(paymentsList.slice(0,10))
      } catch(err){
        console.error('Failed to load dashboard data', err)
        setError('Unable to connect to the API. Make sure the backend is running on http://localhost:3000')
      } finally{
        setLoading(false)
      }
    }
    load()
  },[])

  return (
    <section className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <FiAlertCircle className="text-red-600 text-xl flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard title="Users" value={stats.users} loading={loading} />
        <StatsCard title="Available Plans" value={stats.policies} loading={loading} />
        <StatsCard title="Payments" value={stats.payments} loading={loading} />
      </div>

      <PaymentsChart payments={recentPayments} />

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-primary mb-6">Recent Payments</h2>
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <FiLoader className="animate-spin mr-2 text-2xl" />
            Loading data...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Amount (KES)</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  recentPayments.map((p, idx) => (
                    <tr key={p.id || p.transaction_id || idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm text-gray-900">{new Date(p.paid_date || p.created_at || Date.now()).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-accent">{p.amount}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{p.mpesa_phone || p.phoneNumber || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          (p.status || p.payment_status || '').toLowerCase() === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {p.status || p.payment_status || 'unknown'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
