import React from 'react'
import { Line } from 'react-chartjs-2'
import { FiTrendingUp } from 'react-icons/fi'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function PaymentsChart({ payments = [] }){
  const labels = payments.map(p => new Date(p.paid_date || p.created_at || Date.now()).toLocaleDateString())
  const data = payments.map(p => Number(p.amount) || 0)

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Payments (KES)',
        data,
        fill: true,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Amount (KES)' }
      }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <FiTrendingUp className="text-accent text-2xl" />
        <h2 className="text-xl font-bold text-primary">Payment Trends</h2>
      </div>
      {payments.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No payment data available
        </div>
      ) : (
        <Line data={chartData} options={options} height={200} />
      )}
    </div>
  )
}
