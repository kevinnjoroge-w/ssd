import React from 'react'
import { FiUsers, FiShoppingCart, FiCreditCard } from 'react-icons/fi'

const icons = {
  Users: FiUsers,
  'Available Plans': FiShoppingCart,
  Payments: FiCreditCard
}

export default function StatsCard({ title, value, loading }){
  const Icon = icons[title] || FiCreditCard
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-primary mt-2">{loading ? '...' : value}</p>
        </div>
        <div className="bg-accent bg-opacity-10 p-3 rounded-lg">
          <Icon className="text-accent text-2xl" />
        </div>
      </div>
    </div>
  )
}
